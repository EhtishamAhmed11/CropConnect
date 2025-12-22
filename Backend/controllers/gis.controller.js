// backend/controllers/gis.controller.js
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import CropType from "../models/cropType.model.js";
import TollRate from "../models/tollRate.model.js";
import ApiResponse from "../utils/apiResponse.js";
import * as Calculations from "../utils/calculations.js";
import * as LogisticsService from "../services/logistics.service.js";

// Simple cache for optimized routes (in-memory, lasts until server restart)
const routeCache = new Map();

/**
 * @desc    Get optimized distribution routes with toll and transport costs
 * @route   GET /api/gis/optimize-routes
 * @access  Public
 */
export const getOptimizedRoutes = async (req, res, next) => {
  try {
    const { year, crop, level = "district" } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const targetYear = year;

    // Check cache first
    const cacheKey = `optimized-routes-${targetYear}-${crop.toUpperCase()}-${level}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return ApiResponse.success(res, cached.data, "Routes retrieved from cache");
    }

    // 1. Get Production Data (Basis for optimization)
    const productionData = await ProductionData.find({
      year: targetYear,
      cropCode: crop.toUpperCase(),
      level,
    })
      .populate("district", "name code coordinates population")
      .populate("province", "name code coordinates population")
      .lean();

    if (!productionData || productionData.length === 0) {
      return ApiResponse.success(res, { routes: [], stats: { coveragePercent: 0 } }, "No production data found");
    }

    // Get crop details for consumption calculation
    const cropType = await CropType.findOne({ code: crop.toUpperCase() }).lean();
    const avgConsumption = cropType?.avgConsumptionPerCapita || 0;

    // 2. Get toll rates
    const tollRates = await TollRate.find({ isActive: true }).lean();
    const TRANSPORT_COST_PER_KM = 250;

    // 3. Prepare data sets (Dynamic Balance Calculation)
    const processedRegions = productionData.map(item => {
      const region = level === "district" ? item.district : item.province;
      const population = region?.population || 0;
      const production = item.production.value;
      const consumption = (population * avgConsumption) / 1000; // in tonnes
      const balance = production - consumption;

      return {
        id: level === "district" ? item.districtCode : item.provinceCode,
        name: region?.name || item.districtCode || item.provinceCode,
        production,
        consumption,
        balance,
        coords: region?.coordinates
          ? [region.coordinates.longitude, region.coordinates.latitude]
          : null,
      };
    });

    let surpluses = processedRegions
      .filter((r) => r.balance > 100) // Threshold for meaningful surplus
      .map((r) => ({ ...r, available: r.balance }))
      .filter((s) => s.coords);

    let deficits = processedRegions
      .filter((r) => r.balance < -100)
      .map((r) => ({
        ...r,
        needed: Math.abs(r.balance),
        originalNeed: Math.abs(r.balance),
      }))
      .filter((d) => d.coords)
      .sort((a, b) => b.needed - a.needed);

    // 4. Optimization Engine
    const routes = [];
    let totalTollCost = 0;
    let totalTransportCost = 0;
    let routeCounter = 0;

    for (const deficit of deficits) {
      const nearbySurpluses = surpluses
        .filter((s) => s.available > 0)
        .map((s) => {
          const dist = haversineDistance(s.coords, deficit.coords);
          return { ...s, dist };
        })
        .sort((a, b) => a.dist - b.dist);

      for (const supplier of nearbySurpluses) {
        if (deficit.needed <= 0) break;

        const amountToMove = Math.min(deficit.needed, supplier.available);
        if (amountToMove <= 10) continue;

        const distanceKm = supplier.dist;
        const estimatedToll = estimateTollCost(distanceKm, tollRates);
        const transportCost = Math.round(distanceKm * TRANSPORT_COST_PER_KM);
        const estimatedDuration = Math.round((distanceKm / 50) * 60);

        routes.push({
          id: `route-${supplier.id}-${deficit.id}-${routeCounter++}`,
          sourceName: supplier.name,
          destName: deficit.name,
          from: supplier.coords,
          to: deficit.coords,
          amount: Math.round(amountToMove),
          distance: Math.round(distanceKm),
          costs: {
            toll: estimatedToll,
            transport: transportCost,
            total: estimatedToll + transportCost
          },
          estimatedDuration,
        });

        totalTollCost += estimatedToll;
        totalTransportCost += transportCost;
        deficit.needed -= amountToMove;

        const masterIdx = surpluses.findIndex(s => s.id === supplier.id);
        if (masterIdx !== -1) surpluses[masterIdx].available -= amountToMove;
      }
    }

    // 5. Aggregate Results
    const totalDeficit = deficits.reduce((acc, d) => acc + d.originalNeed, 0);
    const coveredDeficit = routes.reduce((acc, r) => acc + r.amount, 0);
    const totalSurplus = processedRegions.filter(r => r.balance > 0).reduce((acc, r) => acc + r.balance, 0);

    const result = {
      routes,
      stats: {
        totalDeficit: Math.round(totalDeficit),
        totalSurplus: Math.round(totalSurplus),
        coveredDeficit: Math.round(coveredDeficit),
        coveragePercent: totalDeficit > 0 ? Math.round((coveredDeficit / totalDeficit) * 100) : 0,
        uncoveredRegions: deficits.filter(d => d.needed > 100).map(d => d.name),
        totalTollCost: Math.round(totalTollCost),
        totalTransportCost: Math.round(totalTransportCost),
        grandTotalCost: Math.round(totalTollCost + totalTransportCost),
        routeCount: routes.length
      },
      regions: processedRegions
    };

    routeCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return ApiResponse.success(res, result, "Optimized routes calculated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Haversine formula for distance calculation (km)
 */
function haversineDistance(coords1, coords2) {
  const R = 6371; // Earth's radius in km
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate toll cost based on distance and toll rates
 * Assumes articulated truck for bulk transport
 */
function estimateTollCost(distanceKm, tollRates) {
  if (!tollRates || tollRates.length === 0) return 0;

  // Estimate: every ~300km covers one major toll segment
  const segments = Math.ceil(distanceKm / 300);

  // Use average motorway toll for articulated truck
  const motorwayRates = tollRates.filter((r) => r.highwayType === "motorway");
  if (motorwayRates.length === 0) return 0;

  const avgToll =
    motorwayRates.reduce((sum, r) => sum + (r.rates?.articulatedTruck || 0), 0) /
    motorwayRates.length;

  return Math.round(segments * avgToll);
}

/**
 * @desc    Get all provinces with geographic data
 * @route   GET /api/gis/provinces
 * @access  Public
 */
export const getProvinces = async (req, res, next) => {
  try {
    const provinces = await Province.find({ isActive: true })
      .select("code name population area coordinates geometry")
      .lean();

    return ApiResponse.success(
      res,
      provinces,
      "Provinces retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single province with details
 * @route   GET /api/gis/provinces/:code
 * @access  Public
 */
export const getProvinceByCode = async (req, res, next) => {
  try {
    const province = await Province.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true,
    }).lean();

    if (!province) {
      return ApiResponse.error(res, "Province not found", 404);
    }

    return ApiResponse.success(
      res,
      province,
      "Province retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get districts with pagination
 * @route   GET /api/gis/districts
 * @access  Public
 */
export const getDistricts = async (req, res, next) => {
  try {
    const { province, agriculturalZone, page = 1, limit = 100 } = req.query;

    const query = { isActive: true };
    if (province) query.provinceCode = province.toUpperCase();
    if (agriculturalZone) query.agriculturalZone = agriculturalZone;

    const skip = (page - 1) * limit;

    const [districts, total] = await Promise.all([
      District.find(query)
        .populate("province", "name code")
        .select(
          "code name provinceCode population area coordinates geometry agriculturalZone"
        )
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      District.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      districts,
      page,
      limit,
      total,
      "Districts retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single district with details
 * @route   GET /api/gis/districts/:code
 * @access  Public
 */
export const getDistrictByCode = async (req, res, next) => {
  try {
    const district = await District.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true,
    })
      .populate("province", "name code")
      .lean();

    if (!district) {
      return ApiResponse.error(res, "District not found", 404);
    }

    return ApiResponse.success(
      res,
      district,
      "District retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get production map data (for choropleth maps)
 * @route   GET /api/gis/production-map
 * @access  Public
 */
export const getProductionMapData = async (req, res, next) => {
  try {
    const { year, crop, level = "provincial" } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const query = {
      year,
      cropCode: crop.toUpperCase(),
      level,
    };

    // Get production data
    const productionData = await ProductionData.find(query)
      .populate("province", "name code coordinates geometry")
      .populate("district", "name code coordinates geometry")
      .lean();

    // Format for map visualization
    const mapData = productionData.map((item) => {
      const region = level === "district" ? item.district : item.province;

      return {
        regionCode:
          level === "district" ? item.districtCode : item.provinceCode,
        regionName: region?.name,
        coordinates: region?.coordinates,
        geometry: region?.geometry,
        production: item.production.value,
        area: item.areaCultivated.value,
        yield: item.yield.value,
        year: item.year,
        crop: item.cropName,
      };
    });

    return ApiResponse.success(
      res,
      mapData,
      "Production map data retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get surplus/deficit map data
 * @route   GET /api/gis/surplus-deficit-map
 * @access  Public
 */
export const getSurplusDeficitMapData = async (req, res, next) => {
  try {
    const { year, crop, level = "provincial" } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const query = {
      year,
      cropCode: crop.toUpperCase(),
      level,
    };

    // 1. Fetch ALL Production Data
    const productionData = await ProductionData.find(query)
      .populate("province", "name code coordinates geometry population")
      .populate("district", "name code coordinates geometry population")
      .lean();

    if (!productionData || productionData.length === 0) {
      return ApiResponse.success(res, [], "No production data found");
    }

    // 2. Fetch crop details for consumption calculations
    const cropType = await CropType.findOne({ code: crop.toUpperCase() }).lean();
    const avgConsumption = cropType?.avgConsumptionPerCapita || 0;

    // 3. Calculate metrics on-the-fly
    const mapData = productionData.map((prodItem) => {
      const region = level === "district" ? prodItem.district : prodItem.province;
      const regionCode = level === "district" ? prodItem.districtCode : prodItem.provinceCode;
      const population = region?.population || 0;

      const production = prodItem.production.value;
      const consumption = (population * avgConsumption) / 1000; // in tonnes

      const calcResults = Calculations.calculateSurplusDeficit(production, consumption);

      let color = "#10b981"; // Green (Surplus)
      if (calcResults.status === "deficit") {
        if (calcResults.severity === "critical") color = "#ef4444"; // Red
        else if (calcResults.severity === "moderate") color = "#f97316"; // Orange
        else color = "#eab308"; // Yellow
      } else if (calcResults.status === "balanced") {
        color = "#64748b"; // Slate
      }

      return {
        regionCode,
        regionName: region?.name,
        coordinates: region?.coordinates,
        geometry: region?.geometry,
        status: calcResults.status,
        severity: calcResults.severity,
        balance: calcResults.balance,
        production,
        consumption,
        color,
        year: prodItem.year,
        crop: prodItem.cropCode,
        isCalculated: true,
        selfSufficiencyRatio: calcResults.selfSufficiencyRatio
      };
    });

    return ApiResponse.success(
      res,
      mapData,
      "Surplus/deficit map data calculated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get heatmap data for production intensity
 * @route   GET /api/gis/production-heatmap
 * @access  Public
 */
export const getProductionHeatmap = async (req, res, next) => {
  try {
    const { year, crop } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    // Get district-level production data for detailed heatmap
    const productionData = await ProductionData.find({
      year,
      cropCode: crop.toUpperCase(),
      level: "district",
    })
      .populate("district", "name code coordinates")
      .lean();

    // Calculate production intensity (production per square km)
    const heatmapData = productionData
      .filter((item) => item.district?.coordinates)
      .map((item) => ({
        latitude: item.district.coordinates.latitude,
        longitude: item.district.coordinates.longitude,
        intensity: item.production.value, // Can be normalized if needed
        districtName: item.district.name,
        districtCode: item.districtCode,
        production: item.production.value,
        area: item.areaCultivated.value,
      }));

    return ApiResponse.success(
      res,
      heatmapData,
      "Production heatmap data retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get regions within radius (for proximity analysis)
 * @route   GET /api/gis/regions-nearby
 * @access  Public
 */
export const getRegionsNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 100, level = "district" } = req.query;

    if (!latitude || !longitude) {
      return ApiResponse.error(res, "Latitude and longitude are required", 400);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Simple distance calculation (more accurate with proper geospatial queries)
    const Model = level === "district" ? District : Province;

    const regions = await Model.find({ isActive: true })
      .populate(level === "district" ? "province" : "")
      .lean();

    // Calculate distances and filter
    const nearbyRegions = regions
      .map((region) => {
        if (!region.coordinates) return null;

        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = ((region.coordinates.latitude - lat) * Math.PI) / 180;
        const dLon = ((region.coordinates.longitude - lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
          Math.cos((region.coordinates.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...region,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .filter((region) => region && region.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return ApiResponse.success(
      res,
      nearbyRegions,
      `Found ${nearbyRegions.length} regions within ${radiusKm}km`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get GeoJSON for provinces
 * @route   GET /api/gis/geojson/provinces
 * @access  Public
 */
export const getProvincesGeoJSON = async (req, res, next) => {
  try {
    const provinces = await Province.find({ isActive: true })
      .select("code name geometry coordinates population area")
      .lean();

    // Format as GeoJSON FeatureCollection
    const geoJSON = {
      type: "FeatureCollection",
      features: provinces.map((province) => ({
        type: "Feature",
        properties: {
          code: province.code,
          name: province.name,
          population: province.population,
          area: province.area,
        },
        geometry: province.geometry || {
          type: "Point",
          coordinates: [
            province.coordinates.longitude,
            province.coordinates.latitude,
          ],
        },
      })),
    };

    return ApiResponse.success(
      res,
      geoJSON,
      "Provinces GeoJSON retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get GeoJSON for districts
 * @route   GET /api/gis/geojson/districts
 * @access  Public
 */
export const getDistrictsGeoJSON = async (req, res, next) => {
  try {
    const { province } = req.query;

    const query = { isActive: true };
    if (province) query.provinceCode = province.toUpperCase();

    const districts = await District.find(query)
      .select(
        "code name provinceCode geometry coordinates population area agriculturalZone"
      )
      .lean();

    // Format as GeoJSON FeatureCollection
    const geoJSON = {
      type: "FeatureCollection",
      features: districts.map((district) => ({
        type: "Feature",
        properties: {
          code: district.code,
          name: district.name,
          provinceCode: district.provinceCode,
          population: district.population,
          area: district.area,
          agriculturalZone: district.agriculturalZone,
        },
        geometry: district.geometry || {
          type: "Point",
          coordinates: [
            district.coordinates.longitude,
            district.coordinates.latitude,
          ],
        },
      })),
    };

    return ApiResponse.success(
      res,
      geoJSON,
      "Districts GeoJSON retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get suggested route between surplus and deficit regions
 * @route   GET /api/gis/routes
 * @access  Public
 */
export const getRoute = async (req, res, next) => {
  try {
    const { surplusId, deficitId } = req.query;
    if (!surplusId || !deficitId) {
      return ApiResponse.error(res, "SurplusId and DeficitId required", 400);
    }

    const routeData = await LogisticsService.suggestTransport(surplusId, deficitId);

    return ApiResponse.success(res, routeData, "Route calculated successfully");

  } catch (error) {
    next(error);
  }
};

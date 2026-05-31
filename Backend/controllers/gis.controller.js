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

// ─── Cache layer ──────────────────────────────────────────────────────────────
const routeCache   = new Map();
const geoJsonCache = new Map();
const mapDataCache = new Map();
// District coordinate lookup — built once at server startup, never re-queried
let districtCoordCache = null;

const GEOJSON_TTL   = 60 * 60 * 1000;  // 1 hour  — boundaries never change
const MAP_DATA_TTL  =  5 * 60 * 1000;  // 5 mins  — seeded data, low churn
const ROUTE_TTL     = 10 * 60 * 1000;  // 10 mins — optimization results

// ─── Constants ────────────────────────────────────────────────────────────────
const TRUCK_CAPACITY_TONNES   = 20;     // Standard articulated truck load
const COST_PER_TRUCK_PER_KM   = 250;   // PKR per truck per km (NLC/road transport rate)
const ROAD_DISTANCE_FACTOR    = 1.35;  // Road distance ≈ 35% longer than straight line
                                        // (standard correction for South Asian road networks)
const MIN_VIABLE_AMOUNT       = 10;    // tonnes — skip trivial shipments below this
const SURPLUS_THRESHOLD       = 100;   // tonnes — meaningful surplus threshold
const DEFICIT_THRESHOLD       = 100;   // tonnes — meaningful deficit threshold

// Crop value PKR/tonne — used for cost-to-value viability check
const CROP_VALUE_PER_TONNE = { WHEAT: 40000, RICE: 80000, COTTON: 120000 };
// Max logistics cost as % of cargo value — routes above this aren't viable
const MAX_LOGISTICS_RATIO  = 0.35;

// ─── Utility: Haversine distance ─────────────────────────────────────────────
function haversineDistance(coords1, coords2) {
  const R = 6371;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Utility: Realistic transport cost (load-aware) ──────────────────────────
function calculateTransportCost(distanceKm, amountTonnes) {
  const roadKm     = distanceKm * ROAD_DISTANCE_FACTOR;
  const numTrucks  = Math.ceil(amountTonnes / TRUCK_CAPACITY_TONNES);
  return Math.round(roadKm * numTrucks * COST_PER_TRUCK_PER_KM);
}

// ─── Utility: Toll cost using actual TollRate records ────────────────────────
function estimateTollCost(distanceKm, tollRates) {
  if (!tollRates || tollRates.length === 0) return 0;
  const roadKm = distanceKm * ROAD_DISTANCE_FACTOR;
  // Estimate number of toll plazas hit — motorway plazas ~100km apart in Pakistan
  const segments = Math.ceil(roadKm / 100);
  const motorwayRates = tollRates.filter(r => r.highwayType === "motorway");
  if (motorwayRates.length === 0) return 0;
  const avgToll = motorwayRates.reduce(
    (sum, r) => sum + (r.rates?.articulatedTruck || 0), 0
  ) / motorwayRates.length;
  return Math.round(segments * avgToll);
}

// ─── Utility: Build district coordinate lookup (called once) ─────────────────
async function getDistrictCoords() {
  if (districtCoordCache) return districtCoordCache;
  const districts = await District.find({ isActive: true })
    .select("code coordinates")
    .lean();
  districtCoordCache = {};
  for (const d of districts) {
    if (d.coordinates?.latitude && d.coordinates?.longitude) {
      districtCoordCache[d.code] = [d.coordinates.longitude, d.coordinates.latitude];
    }
  }
  return districtCoordCache;
}

// ─── Pre-compute pairwise distance matrix ────────────────────────────────────
function buildDistanceMatrix(regions) {
  const matrix = {};
  for (const r1 of regions) {
    matrix[r1.id] = {};
    for (const r2 of regions) {
      if (r1.coords && r2.coords) {
        matrix[r1.id][r2.id] = haversineDistance(r1.coords, r2.coords);
      }
    }
  }
  return matrix;
}

// ─── getSurplusDeficitMapData ─────────────────────────────────────────────────
/**
 * @desc    Get surplus/deficit map data
 * @route   GET /api/gis/surplus-deficit-map
 * @access  Public
 *
 * IMPROVEMENT: Reads pre-calculated values from SurplusDeficit collection
 * instead of re-running balance math on every request.
 * Falls back to live calculation if SurplusDeficit is empty.
 */
export const getSurplusDeficitMapData = async (req, res, next) => {
  try {
    const { year, crop, level = "district" } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const cacheKey = `sd-map-${year}-${crop.toUpperCase()}-${level}`;
    const cached = mapDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < MAP_DATA_TTL) {
      return ApiResponse.success(res, cached.data, "Surplus/deficit map data retrieved from cache");
    }

    // ── Try reading from SurplusDeficit collection first (fast path) ──────────
    const surplusDeficitDocs = await SurplusDeficit.find({
      year,
      cropCode: crop.toUpperCase(),
      level,
    })
      .populate(
        level === "district" ? "district" : "province",
        "name code coordinates geometry"
      )
      .lean();

    let mapData;

    if (surplusDeficitDocs && surplusDeficitDocs.length > 0) {
      // Fast path — data already calculated in seed
      mapData = surplusDeficitDocs.map(doc => {
        const region = level === "district" ? doc.district : doc.province;

        let color = "#10b981"; // surplus green
        if (doc.status === "deficit") {
          if (doc.severity === "critical")      color = "#ef4444";
          else if (doc.severity === "moderate") color = "#f97316";
          else                                  color = "#eab308";
        } else if (doc.status === "balanced") {
          color = "#64748b";
        }

        return {
          regionCode:   level === "district" ? doc.districtCode : doc.provinceCode,
          regionName:   region?.name,
          coordinates:  region?.coordinates,
          geometry:     region?.geometry,
          status:       doc.status,
          severity:     doc.severity,
          balance:      doc.balance,
          production:   doc.production,
          consumption:  doc.consumption,
          color,
          year:         doc.year,
          crop:         doc.cropCode,
          selfSufficiencyRatio:     doc.selfSufficiencyRatio,
          surplusDeficitPercentage: doc.surplusDeficitPercentage,
          requiresIntervention:     doc.requiresIntervention,
          dataSource:   doc.dataSource,
        };
      });

    } else {
      // Fallback — live calculation from ProductionData (no seed data yet)
      const productionData = await ProductionData.find({
        year, cropCode: crop.toUpperCase(), level,
      })
        .populate("province", "name code coordinates geometry population")
        .populate("district", "name code coordinates geometry population")
        .lean();

      if (!productionData || productionData.length === 0) {
        return ApiResponse.success(res, [], "No production data found");
      }

      const cropType = await CropType.findOne({ code: crop.toUpperCase() }).lean();
      const avgConsumption = cropType?.avgConsumptionPerCapita || 0;

      mapData = productionData.map(prodItem => {
        const region     = level === "district" ? prodItem.district : prodItem.province;
        const regionCode = level === "district" ? prodItem.districtCode : prodItem.provinceCode;
        const population = region?.population || 0;
        const production = prodItem.production.value;
        const consumption = (population * avgConsumption) / 1000;
        const calcResults = Calculations.calculateSurplusDeficit(production, consumption);

        let color = "#10b981";
        if (calcResults.status === "deficit") {
          if (calcResults.severity === "critical")      color = "#ef4444";
          else if (calcResults.severity === "moderate") color = "#f97316";
          else                                          color = "#eab308";
        } else if (calcResults.status === "balanced") {
          color = "#64748b";
        }

        return {
          regionCode,
          regionName:   region?.name,
          coordinates:  region?.coordinates,
          geometry:     region?.geometry,
          status:       calcResults.status,
          severity:     calcResults.severity,
          balance:      calcResults.balance,
          production,
          consumption,
          color,
          year:         prodItem.year,
          crop:         prodItem.cropCode,
          selfSufficiencyRatio:     calcResults.selfSufficiencyRatio,
          surplusDeficitPercentage: calcResults.surplusDeficitPercentage,
          requiresIntervention:     calcResults.requiresIntervention,
          dataSource:   "live_calculation",
        };
      });
    }

    mapDataCache.set(cacheKey, { data: mapData, timestamp: Date.now() });
    return ApiResponse.success(res, mapData, "Surplus/deficit map data retrieved successfully");

  } catch (error) {
    next(error);
  }
};

// ─── getOptimizedRoutes ───────────────────────────────────────────────────────
/**
 * @desc    Get optimized distribution routes with realistic cost estimates
 * @route   GET /api/gis/optimize-routes
 * @access  Public
 *
 * IMPROVEMENTS vs original:
 *   1. Reads from SurplusDeficit collection — no re-calculation of balance
 *   2. Road distance factor (×1.35) — more accurate than straight-line
 *   3. Load-aware transport cost — cost scales with number of trucks needed
 *   4. Cost-to-value viability check — skip routes where logistics > 35% of cargo value
 *   5. Pre-computed distance matrix — O(n²) once, then O(1) lookups
 *   6. Toll cost uses 100km plaza intervals (Pakistan motorway standard)
 */
export const getOptimizedRoutes = async (req, res, next) => {
  try {
    const { year, crop, level = "district" } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const cropUpper = crop.toUpperCase();
    const cacheKey  = `optimized-routes-${year}-${cropUpper}-${level}`;
    const cached    = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ROUTE_TTL) {
      return ApiResponse.success(res, cached.data, "Routes retrieved from cache");
    }

    // ── 1. Load pre-calculated surplus/deficit records ────────────────────────
    const sdDocs = await SurplusDeficit.find({
      year,
      cropCode: cropUpper,
      level,
    })
      .populate(
        level === "district" ? "district" : "province",
        "name code coordinates"
      )
      .lean();

    if (!sdDocs || sdDocs.length === 0) {
      return ApiResponse.success(
        res,
        { routes: [], stats: { coveragePercent: 0 }, regions: [] },
        "No surplus/deficit data found. Run the seed first."
      );
    }

    // ── 2. Load toll rates ────────────────────────────────────────────────────
    const tollRates = await TollRate.find({ isActive: true }).lean();

    // ── 3. Build region list with coordinates ─────────────────────────────────
    const coordCache = await getDistrictCoords();

    const regions = sdDocs.map(doc => {
      const region    = level === "district" ? doc.district : doc.province;
      const code      = level === "district" ? doc.districtCode : doc.provinceCode;
      const coords    = coordCache[code] ||
        (region?.coordinates
          ? [region.coordinates.longitude, region.coordinates.latitude]
          : null);

      return {
        id:          code,
        name:        region?.name || code,
        production:  doc.production,
        consumption: doc.consumption,
        balance:     doc.balance,
        status:      doc.status,
        severity:    doc.severity,
        coords,
      };
    });

    // ── 4. Split into surpluses and deficits ──────────────────────────────────
    let surpluses = regions
      .filter(r => r.balance > SURPLUS_THRESHOLD && r.coords)
      .map(r => ({ ...r, available: r.balance }));

    let deficits = regions
      .filter(r => r.balance < -DEFICIT_THRESHOLD && r.coords)
      .map(r => ({ ...r, needed: Math.abs(r.balance), originalNeed: Math.abs(r.balance) }))
      .sort((a, b) => b.needed - a.needed); // worst deficit first

    if (surpluses.length === 0 || deficits.length === 0) {
      const result = {
        routes: [],
        stats:  {
          totalDeficit:     Math.round(deficits.reduce((s, d) => s + d.originalNeed, 0)),
          totalSurplus:     Math.round(surpluses.reduce((s, r) => s + r.available, 0)),
          coveredDeficit:   0,
          coveragePercent:  0,
          uncoveredRegions: deficits.map(d => d.name),
          totalTollCost:       0,
          totalTransportCost:  0,
          grandTotalCost:      0,
          routeCount:          0,
        },
        regions,
      };
      routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return ApiResponse.success(res, result, "No viable routes — no matching surplus/deficit regions");
    }

    // ── 5. Pre-compute distance matrix ────────────────────────────────────────
    const allRegions = [...surpluses, ...deficits];
    const distMatrix = buildDistanceMatrix(allRegions);

    // ── 6. Greedy nearest-neighbour matching with viability filter ────────────
    const routes         = [];
    let totalTollCost    = 0;
    let totalTransportCost = 0;
    let routeCounter     = 0;
    const cropValue      = CROP_VALUE_PER_TONNE[cropUpper] || 40000;

    for (const deficit of deficits) {
      const candidates = surpluses
        .filter(s => s.available > 0 && distMatrix[s.id]?.[deficit.id] !== undefined)
        .map(s => ({ ...s, dist: distMatrix[s.id][deficit.id] }))
        .sort((a, b) => a.dist - b.dist);

      for (const supplier of candidates) {
        if (deficit.needed <= 0) break;

        const amountToMove = Math.min(deficit.needed, supplier.available);
        if (amountToMove < MIN_VIABLE_AMOUNT) continue;

        const haversineKm  = supplier.dist;
        const roadKm       = Math.round(haversineKm * ROAD_DISTANCE_FACTOR);
        const transportCost = calculateTransportCost(haversineKm, amountToMove);
        const tollCost      = estimateTollCost(haversineKm, tollRates);
        const totalCost     = transportCost + tollCost;

        // Viability check: skip if logistics cost > MAX_LOGISTICS_RATIO of cargo value
        const cargoValue = amountToMove * cropValue;
        if (totalCost > cargoValue * MAX_LOGISTICS_RATIO) continue;

        const numTrucks         = Math.ceil(amountToMove / TRUCK_CAPACITY_TONNES);
        const estimatedDuration = Math.round((roadKm / 50) * 60); // minutes at 50 km/h avg

        routes.push({
          id:           `route-${supplier.id}-${deficit.id}-${routeCounter++}`,
          sourceName:   supplier.name,
          sourceCode:   supplier.id,
          destName:     deficit.name,
          destCode:     deficit.id,
          from:         supplier.coords,
          to:           deficit.coords,
          amount:       Math.round(amountToMove),
          distance:     roadKm,           // road distance shown to user
          haversineKm:  Math.round(haversineKm),
          numTrucks,
          costs: {
            transport: transportCost,
            toll:      tollCost,
            total:     totalCost,
          },
          estimatedDuration,
          deficitSeverity: deficit.severity,
        });

        totalTollCost      += tollCost;
        totalTransportCost += transportCost;
        deficit.needed     -= amountToMove;

        // Update master surplus list
        const masterIdx = surpluses.findIndex(s => s.id === supplier.id);
        if (masterIdx !== -1) surpluses[masterIdx].available -= amountToMove;
      }
    }

    // ── 7. Aggregate stats ────────────────────────────────────────────────────
    const totalDeficit    = deficits.reduce((acc, d) => acc + d.originalNeed, 0);
    const coveredDeficit  = routes.reduce((acc, r) => acc + r.amount, 0);
    const totalSurplus    = surpluses.reduce((acc, s) => acc + (s.balance || 0), 0);
    const grandTotalCost  = totalTollCost + totalTransportCost;

    const result = {
      routes,
      stats: {
        totalDeficit:      Math.round(totalDeficit),
        totalSurplus:      Math.round(totalSurplus),
        coveredDeficit:    Math.round(coveredDeficit),
        coveragePercent:   totalDeficit > 0 ? Math.round((coveredDeficit / totalDeficit) * 100) : 0,
        uncoveredRegions:  deficits.filter(d => d.needed > DEFICIT_THRESHOLD).map(d => d.name),
        totalTollCost:     Math.round(totalTollCost),
        totalTransportCost: Math.round(totalTransportCost),
        grandTotalCost:    Math.round(grandTotalCost),
        routeCount:        routes.length,
        totalTrucks:       routes.reduce((s, r) => s + r.numTrucks, 0),
        costPerTonne:      coveredDeficit > 0 ? Math.round(grandTotalCost / coveredDeficit) : 0,
        // Viability note shown in UI
        note: `Road distance = Haversine × ${ROAD_DISTANCE_FACTOR}. Transport cost = PKR ${COST_PER_TRUCK_PER_KM}/truck/km × ceil(amount/${TRUCK_CAPACITY_TONNES}t) trucks.`,
      },
      regions,
    };

    routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return ApiResponse.success(res, result, "Optimized routes calculated successfully");

  } catch (error) {
    next(error);
  }
};

// ─── getProvinces ─────────────────────────────────────────────────────────────
export const getProvinces = async (req, res, next) => {
  try {
    const provinces = await Province.find({ isActive: true })
      .select("code name population area coordinates geometry")
      .lean();
    return ApiResponse.success(res, provinces, "Provinces retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getProvinceByCode ────────────────────────────────────────────────────────
export const getProvinceByCode = async (req, res, next) => {
  try {
    const province = await Province.findOne({
      code: req.params.code.toUpperCase(), isActive: true,
    }).lean();
    if (!province) return ApiResponse.error(res, "Province not found", 404);
    return ApiResponse.success(res, province, "Province retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getDistricts ─────────────────────────────────────────────────────────────
export const getDistricts = async (req, res, next) => {
  try {
    const { province, agriculturalZone, page = 1, limit = 100 } = req.query;
    const query = { isActive: true };
    if (province)        query.provinceCode    = province.toUpperCase();
    if (agriculturalZone) query.agriculturalZone = agriculturalZone;

    const skip = (page - 1) * limit;
    const [districts, total] = await Promise.all([
      District.find(query)
        .populate("province", "name code")
        .select("code name provinceCode population area coordinates geometry agriculturalZone")
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      District.countDocuments(query),
    ]);

    return ApiResponse.paginated(res, districts, page, limit, total, "Districts retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getDistrictByCode ────────────────────────────────────────────────────────
export const getDistrictByCode = async (req, res, next) => {
  try {
    const district = await District.findOne({
      code: req.params.code.toUpperCase(), isActive: true,
    }).populate("province", "name code").lean();
    if (!district) return ApiResponse.error(res, "District not found", 404);
    return ApiResponse.success(res, district, "District retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getProductionMapData ─────────────────────────────────────────────────────
export const getProductionMapData = async (req, res, next) => {
  try {
    const { year, crop, level = "provincial" } = req.query;
    if (!year || !crop) return ApiResponse.error(res, "Year and crop are required", 400);

    const productionData = await ProductionData.find({ year, cropCode: crop.toUpperCase(), level })
      .populate("province", "name code coordinates geometry")
      .populate("district", "name code coordinates geometry")
      .lean();

    const mapData = productionData.map(item => {
      const region = level === "district" ? item.district : item.province;
      return {
        regionCode:  level === "district" ? item.districtCode : item.provinceCode,
        regionName:  region?.name,
        coordinates: region?.coordinates,
        geometry:    region?.geometry,
        production:  item.production.value,
        area:        item.areaCultivated.value,
        yield:       item.yield.value,
        year:        item.year,
        crop:        item.cropName,
      };
    });

    return ApiResponse.success(res, mapData, "Production map data retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getProductionHeatmap ─────────────────────────────────────────────────────
export const getProductionHeatmap = async (req, res, next) => {
  try {
    const { year, crop } = req.query;
    if (!year || !crop) return ApiResponse.error(res, "Year and crop are required", 400);

    const productionData = await ProductionData.find({ year, cropCode: crop.toUpperCase(), level: "district" })
      .populate("district", "name code coordinates")
      .lean();

    const heatmapData = productionData
      .filter(item => item.district?.coordinates)
      .map(item => ({
        latitude:     item.district.coordinates.latitude,
        longitude:    item.district.coordinates.longitude,
        intensity:    item.production.value,
        districtName: item.district.name,
        districtCode: item.districtCode,
        production:   item.production.value,
        area:         item.areaCultivated.value,
      }));

    return ApiResponse.success(res, heatmapData, "Production heatmap data retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getRegionsNearby ─────────────────────────────────────────────────────────
export const getRegionsNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 100, level = "district" } = req.query;
    if (!latitude || !longitude) return ApiResponse.error(res, "Latitude and longitude are required", 400);

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);
    const Model = level === "district" ? District : Province;

    const regions = await Model.find({ isActive: true })
      .populate(level === "district" ? "province" : "")
      .lean();

    const nearbyRegions = regions
      .map(region => {
        if (!region.coordinates) return null;
        const dist = haversineDistance(
          [lon, lat],
          [region.coordinates.longitude, region.coordinates.latitude]
        );
        return { ...region, distance: Math.round(dist * 10) / 10 };
      })
      .filter(r => r && r.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return ApiResponse.success(res, nearbyRegions, `Found ${nearbyRegions.length} regions within ${radiusKm}km`);
  } catch (error) { next(error); }
};

// ─── getProvincesGeoJSON ──────────────────────────────────────────────────────
export const getProvincesGeoJSON = async (req, res, next) => {
  try {
    const provinces = await Province.find({ isActive: true })
      .select("code name geometry coordinates population area")
      .lean();

    const geoJSON = {
      type: "FeatureCollection",
      features: provinces.map(p => ({
        type: "Feature",
        properties: { code: p.code, name: p.name, population: p.population, area: p.area },
        geometry: p.geometry || {
          type: "Point",
          coordinates: [p.coordinates.longitude, p.coordinates.latitude],
        },
      })),
    };

    return ApiResponse.success(res, geoJSON, "Provinces GeoJSON retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getDistrictsGeoJSON ──────────────────────────────────────────────────────
export const getDistrictsGeoJSON = async (req, res, next) => {
  try {
    const { province } = req.query;
    const cacheKey = `geojson-districts-${province || "all"}`;
    const cached = geoJsonCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GEOJSON_TTL) {
      return ApiResponse.success(res, cached.data, "Districts GeoJSON retrieved from cache");
    }

    const query = { isActive: true };
    if (province) query.provinceCode = province.toUpperCase();

    const districts = await District.find(query)
      .select("code name provinceCode geometry coordinates population area agriculturalZone")
      .lean();

    const geoJSON = {
      type: "FeatureCollection",
      features: districts.map(d => ({
        type: "Feature",
        properties: {
          code:             d.code,
          name:             d.name,
          provinceCode:     d.provinceCode,
          population:       d.population,
          area:             d.area,
          agriculturalZone: d.agriculturalZone,
        },
        geometry: d.geometry || {
          type: "Point",
          coordinates: [d.coordinates.longitude, d.coordinates.latitude],
        },
      })),
    };

    geoJsonCache.set(cacheKey, { data: geoJSON, timestamp: Date.now() });
    return ApiResponse.success(res, geoJSON, "Districts GeoJSON retrieved successfully");
  } catch (error) { next(error); }
};

// ─── getRoute ─────────────────────────────────────────────────────────────────
export const getRoute = async (req, res, next) => {
  try {
    const { surplusId, deficitId } = req.query;
    if (!surplusId || !deficitId) return ApiResponse.error(res, "SurplusId and DeficitId required", 400);
    const routeData = await LogisticsService.suggestTransport(surplusId, deficitId);
    return ApiResponse.success(res, routeData, "Route calculated successfully");
  } catch (error) { next(error); }
};

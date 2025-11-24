// backend/controllers/gis.controller.js
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import ApiResponse from "../utils/apiResponse.js";

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

    // Get surplus/deficit data
    const surplusDeficitData = await SurplusDeficit.find(query)
      .populate("province", "name code coordinates geometry")
      .populate("district", "name code coordinates geometry")
      .lean();

    // Format for map visualization with color coding
    const mapData = surplusDeficitData.map((item) => {
      const region = level === "district" ? item.district : item.province;

      // Determine map color based on status and severity
      let color = "#28a745"; // Green for surplus
      if (item.status === "deficit") {
        if (item.severity === "critical") color = "#dc3545"; // Red
        else if (item.severity === "moderate") color = "#fd7e14"; // Orange
        else color = "#ffc107"; // Yellow
      } else if (item.status === "balanced") {
        color = "#6c757d"; // Gray
      }

      return {
        regionCode:
          level === "district" ? item.districtCode : item.provinceCode,
        regionName: region?.name,
        coordinates: region?.coordinates,
        geometry: region?.geometry,
        status: item.status,
        severity: item.severity,
        balance: item.balance,
        surplusDeficitPercentage: item.surplusDeficitPercentage,
        selfSufficiencyRatio: item.selfSufficiencyRatio,
        production: item.production,
        consumption: item.consumption,
        color,
        year: item.year,
        crop: item.cropCode,
      };
    });

    return ApiResponse.success(
      res,
      mapData,
      "Surplus/deficit map data retrieved successfully"
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

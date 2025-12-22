import cache from "../services/cache.service.js";
import ProductionData from "../models/productionData.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import CropType from "../models/cropType.model.js";
import ApiResponse from "../utils/apiResponse.js";
import { calculateGrowthRate } from "../utils/calculations.js";

/**
 * @desc    Get all crop types
 * @route   GET /api/production/crop-types
 * @access  Public
 */
export const getCropTypes = async (req, res, next) => {
  try {
    const crops = await CropType.find({}).sort({ name: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: crops,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get production metadata (years, crops, provinces)
 * @route   GET /api/production/metadata
 * @access  Public
 */
export const getProductionMetadata = async (req, res, next) => {
  try {
    const [years, crops, provinces] = await Promise.all([
      ProductionData.distinct("year"),
      ProductionData.distinct("cropCode"),
      ProductionData.distinct("provinceCode"),
    ]);

    return ApiResponse.success(
      res,
      {
        years: years.sort().reverse(),
        crops: crops.sort(),
        provinces: provinces.sort(),
      },
      "Production metadata retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProductionData = async (req, res, next) => {
  try {
    const {
      year,
      crop,
      province,
      district,
      level,
      page = 1,
      limit = 50,
      sortBy = "year",
      sortOrder = "desc",
    } = req.query;

    // Cache check
    const cacheKey = cache.generateKey("production_data", { year, crop, province, district, level, page, limit, sortBy, sortOrder });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.paginated(res, cachedData.data, page, limit, cachedData.total, "Production data retrieved from cache");
    }

    const query = {};

    if (year) query.year = year;
    if (crop) query.cropCode = crop.toUpperCase();
    if (province) query.provinceCode = province.toUpperCase();
    if (district) query.districtCode = district.toUpperCase();
    if (level) query.level = level;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ProductionData.find(query)
        .populate("province", "name code")
        .populate("district", "name code")
        .populate("cropType", "name code category")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ProductionData.countDocuments(query),
    ]);

    // Store in cache
    cache.set(cacheKey, { data, total });

    return ApiResponse.paginated(
      res,
      data,
      page,
      limit,
      total,
      "Production data retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProductionById = async (req, res, next) => {
  try {
    const production = await ProductionData.findById(req.params.id)
      .populate("province", "name code population")
      .populate("district", "name code population")
      .populate("cropType", "name code category avgConsumptionPerCapita");

    if (!production) {
      return ApiResponse.error(res, "Production data not found", 404);
    }

    return ApiResponse.success(
      res,
      production,
      "Production data retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get production summary/statistics
 * @route   GET /api/production/summary
 * @access  Public
 */
export const getProductionSummary = async (req, res, next) => {
  try {
    const { year, crop, province, district, level } = req.query;

    const matchStage = {};
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (province) matchStage.provinceCode = province.toUpperCase();
    if (district) matchStage.districtCode = district.toUpperCase();

    // If level is specified, we filter by it. 
    // BUT if we want a National overview from district data, we should match level: 'district'
    // For simplicity, if no specific district/province is selected, and we want a summary, 
    // we should use district-level data to avoid double counting.
    if (level) {
      matchStage.level = level;
    } else if (!district && !province) {
      // Check if we have district data for this query
      const hasDistricts = await ProductionData.exists({ ...matchStage, level: "district" });
      if (hasDistricts) {
        matchStage.level = "district";
      } else {
        // Fallback to provincial or national based on what matches
        const hasProvinces = await ProductionData.exists({ ...matchStage, level: "provincial" });
        if (hasProvinces) {
          matchStage.level = "provincial";
        } else {
          matchStage.level = "national";
        }
      }
    }

    // Cache check
    const cacheKey = cache.generateKey("production_summary", matchStage);
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Production summary retrieved from cache");
    }

    const summary = await ProductionData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
          recordCount: { $sum: 1 },
          minProduction: { $min: "$production.value" },
          maxProduction: { $max: "$production.value" },
        },
      },
    ]);

    const result =
      summary.length > 0
        ? summary[0]
        : {
          totalProduction: 0,
          totalArea: 0,
          avgYield: 0,
          recordCount: 0,
          minProduction: 0,
          maxProduction: 0,
        };

    // Remove _id field
    delete result._id;

    // Store in cache
    cache.set(cacheKey, result);

    return ApiResponse.success(
      res,
      result,
      "Production summary retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get production trends over time
 * @route   GET /api/production/trends
 * @access  Public
 */
export const getProductionTrends = async (req, res, next) => {
  try {
    const { crop, province, district, level = "national" } = req.query;

    // Cache check
    const cacheKey = cache.generateKey("trends", { crop, province, district, level });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Production trends retrieved from cache");
    }

    const matchStage = {};
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (province) matchStage.provinceCode = province.toUpperCase();
    if (district) matchStage.districtCode = district.toUpperCase();

    // To avoid double counting (district + province + national), 
    // we always aggregate from the 'district' level when looking at higher levels.
    // To avoid double counting, we determine the best level to aggregate from
    if (level === "national") {
      const hasDistricts = await ProductionData.exists({ ...matchStage, level: "district" });
      if (hasDistricts) {
        matchStage.level = "district";
      } else {
        const hasProvinces = await ProductionData.exists({ ...matchStage, level: "provincial" });
        if (hasProvinces) {
          matchStage.level = "provincial";
        } else {
          matchStage.level = "national";
        }
      }
    } else if (level === "provincial") {
      const hasDistricts = await ProductionData.exists({ ...matchStage, level: "district" });
      if (hasDistricts) {
        matchStage.level = "district";
      } else {
        matchStage.level = "provincial";
      }
    } else {
      matchStage.level = level;
    }

    const trends = await ProductionData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: "$year",
            crop: "$cropCode",
          },
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
      { $sort: { "_id.year": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          crop: "$_id.crop",
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Calculate growth rates
    const trendsWithGrowth = trends.map((item, index) => {
      if (index === 0) {
        return { ...item, growthRate: 0 };
      }

      const previousItem = trends[index - 1];
      if (item.crop === previousItem.crop) {
        const growthRate = calculateGrowthRate(
          item.production,
          previousItem.production
        );
        return { ...item, growthRate: parseFloat(growthRate) };
      }

      return { ...item, growthRate: 0 };
    });

    // Store in cache
    cache.set(cacheKey, trendsWithGrowth);

    return ApiResponse.success(
      res,
      trendsWithGrowth,
      "Production trends retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get production data grouped by crop
 * @route   GET /api/production/by-crop
 * @access  Public
 */
export const getProductionByCrop = async (req, res, next) => {
  try {
    const { year, province } = req.query;

    const matchStage = { level: "national" };
    if (year) matchStage.year = year;
    if (province) matchStage.provinceCode = province.toUpperCase();

    // Cache check
    const cacheKey = cache.generateKey("production_by_crop", { year, province });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Production by crop retrieved from cache");
    }

    const byCrop = await ProductionData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$cropCode",
          cropName: { $first: "$cropName" },
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
      { $sort: { totalProduction: -1 } },
      {
        $project: {
          _id: 0,
          crop: "$_id",
          cropName: 1,
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Store in cache
    cache.set(cacheKey, byCrop);

    return ApiResponse.success(
      res,
      byCrop,
      "Production by crop retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get production data grouped by province
 * @route   GET /api/production/by-province
 * @access  Public
 */
export const getProductionByProvince = async (req, res, next) => {
  try {
    const { year, crop } = req.query;

    const matchStage = { level: "provincial" };
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();

    // Cache check
    const cacheKey = cache.generateKey("production_by_province", { year, crop });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Production by province retrieved from cache");
    }

    const byProvince = await ProductionData.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "provinces",
          localField: "province",
          foreignField: "_id",
          as: "provinceInfo",
        },
      },
      { $unwind: "$provinceInfo" },
      {
        $group: {
          _id: "$provinceCode",
          provinceName: { $first: "$provinceInfo.name" },
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
      { $sort: { totalProduction: -1 } },
      {
        $project: {
          _id: 0,
          provinceCode: "$_id",
          provinceName: 1,
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Calculate percentage share
    const totalProduction = byProvince.reduce(
      (sum, item) => sum + item.production,
      0
    );

    const withShare = byProvince.map((item) => ({
      ...item,
      sharePercentage: ((item.production / totalProduction) * 100).toFixed(2),
    }));

    // Store in cache
    cache.set(cacheKey, withShare);

    return ApiResponse.success(
      res,
      withShare,
      "Production by province retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get top producing districts
 * @route   GET /api/production/top-districts
 * @access  Public
 */

export const getTopDistricts = async (req, res, next) => {
  try {
    const { year, crop, province, limit = 10 } = req.query;

    const matchStage = { level: "district" };
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (province) matchStage.provinceCode = province.toUpperCase();

    // Cache check
    const cacheKey = cache.generateKey("top_districts", { year, crop, province, limit });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Top districts retrieved from cache");
    }

    const topDistricts = await ProductionData.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "districts",
          localField: "district",
          foreignField: "_id",
          as: "districtInfo",
        },
      },
      { $unwind: "$districtInfo" },
      {
        $lookup: {
          from: "provinces",
          localField: "province",
          foreignField: "_id",
          as: "provinceInfo",
        },
      },
      { $unwind: "$provinceInfo" },
      {
        $group: {
          _id: "$districtCode",
          districtName: { $first: "$districtInfo.name" },
          provinceName: { $first: "$provinceInfo.name" },
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
      { $sort: { totalProduction: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          districtCode: "$_id",
          districtName: 1,
          provinceName: 1,
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Store in cache
    cache.set(cacheKey, topDistricts);

    return ApiResponse.success(
      res,
      topDistricts,
      `Top ${limit} districts retrieved successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new production data (Admin only)
 * @route   POST /api/production
 * @access  Private/Admin
 */
export const createProductionData = async (req, res, next) => {
  try {
    const produtionData = await ProductionData.create(req.body);
    return ApiResponse.created(
      res,
      productionData,
      "Production data created successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Update production data (Admin only)
 * @route   PUT /api/production/:id
 * @access  Private/Admin
 */
export const updateProductionData = async (req, res, next) => {
  try {
    const production = await ProductionData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!production) {
      return ApiResponse.error(res, "Production data not found", 404);
    }

    return ApiResponse.success(
      res,
      production,
      "Production data updated successfully"
    );
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Delete production data (Admin only)
 * @route   DELETE /api/production/:id
 * @access  Private/Admin
 */
export const deleteProductionData = async (req, res, next) => {
  try {
    const production = await ProductionData.findByIdAndDelete(req.params.id);

    if (!production) {
      return ApiResponse.error(res, "Production data not found", 404);
    }

    return ApiResponse.success(
      res,
      null,
      "Production data deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

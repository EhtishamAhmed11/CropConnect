// backend/controllers/regional.controller.js
import ProductionData from "../models/productionData.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import ApiResponse from "../utils/apiResponse.js";
import { calculateGrowthRate } from "../utils/calculations.js";

/**
 * @desc    Compare multiple regions (provinces or districts)
 * @route   POST /api/regional/compare
 * @access  Public
 */
export const compareRegions = async (req, res, next) => {
  try {
    const { regions, year, crop, metric = "production" } = req.body;

    // Validate input
    if (!regions || !Array.isArray(regions) || regions.length < 2) {
      return ApiResponse.error(
        res,
        "Please provide at least 2 regions to compare",
        400
      );
    }

    if (regions.length > 5) {
      return ApiResponse.error(
        res,
        "Maximum 5 regions can be compared at once",
        400
      );
    }

    // Build queries for each region
    const comparisonResults = await Promise.all(
      regions.map(async (region) => {
        const query = {};

        if (year) query.year = year;
        if (crop) query.cropCode = crop.toUpperCase();

        // Determine if region is province or district
        if (region.type === "province") {
          query.provinceCode = region.code.toUpperCase();
          query.level = "provincial";
        } else if (region.type === "district") {
          query.districtCode = region.code.toUpperCase();
          query.level = "district";
        }

        const data = await ProductionData.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalProduction: { $sum: "$production.value" },
              totalArea: { $sum: "$areaCultivated.value" },
              avgYield: { $avg: "$yield.value" },
              recordCount: { $sum: 1 },
            },
          },
        ]);

        // Get region details
        let regionDetails;
        if (region.type === "province") {
          regionDetails = await Province.findOne({
            code: region.code.toUpperCase(),
          });
        } else {
          regionDetails = await District.findOne({
            code: region.code.toUpperCase(),
          }).populate("province", "name code");
        }

        const result =
          data.length > 0
            ? data[0]
            : {
                totalProduction: 0,
                totalArea: 0,
                avgYield: 0,
                recordCount: 0,
              };

        return {
          region: {
            type: region.type,
            code: region.code,
            name: regionDetails?.name || "Unknown",
            ...(region.type === "district" && {
              province: regionDetails?.province?.name,
            }),
          },
          metrics: {
            production: Math.round(result.totalProduction * 100) / 100,
            area: Math.round(result.totalArea * 100) / 100,
            yield: Math.round(result.avgYield * 1000) / 1000,
          },
          recordCount: result.recordCount,
        };
      })
    );

    // Calculate rankings based on selected metric
    const ranked = comparisonResults
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }))
      .sort((a, b) => b.metrics[metric] - a.metrics[metric])
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return ApiResponse.success(
      res,
      {
        comparison: ranked,
        metric,
        year: year || "all",
        crop: crop || "all",
      },
      "Regional comparison completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed regional performance
 * @route   GET /api/regional/performance/:regionType/:regionCode
 * @access  Public
 */
export const getRegionalPerformance = async (req, res, next) => {
  try {
    const { regionType, regionCode } = req.params;
    const { year } = req.query;

    // Validate region type
    if (!["province", "district"].includes(regionType)) {
      return ApiResponse.error(
        res,
        'Invalid region type. Must be "province" or "district"',
        400
      );
    }

    // Build query
    const query = {};
    if (year) query.year = year;

    if (regionType === "province") {
      query.provinceCode = regionCode.toUpperCase();
      query.level = "provincial";
    } else {
      query.districtCode = regionCode.toUpperCase();
      query.level = "district";
    }

    // Get region details
    let regionDetails;
    if (regionType === "province") {
      regionDetails = await Province.findOne({
        code: regionCode.toUpperCase(),
      });
    } else {
      regionDetails = await District.findOne({
        code: regionCode.toUpperCase(),
      }).populate("province", "name code");
    }

    if (!regionDetails) {
      return ApiResponse.error(res, "Region not found", 404);
    }

    // Get overall metrics
    const overallMetrics = await ProductionData.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
    ]);

    // Get breakdown by crop
    const cropBreakdown = await ProductionData.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$cropCode",
          cropName: { $first: "$cropName" },
          production: { $sum: "$production.value" },
          area: { $sum: "$areaCultivated.value" },
          yield: { $avg: "$yield.value" },
        },
      },
      { $sort: { production: -1 } },
      {
        $project: {
          _id: 0,
          crop: "$_id",
          cropName: 1,
          production: { $round: ["$production", 2] },
          area: { $round: ["$area", 2] },
          yield: { $round: ["$yield", 3] },
        },
      },
    ]);

    // Get historical trends (last 7 years)
    const trends = await ProductionData.aggregate([
      {
        $match: {
          ...(regionType === "province"
            ? { provinceCode: regionCode.toUpperCase(), level: "provincial" }
            : { districtCode: regionCode.toUpperCase(), level: "district" }),
        },
      },
      {
        $group: {
          _id: "$year",
          totalProduction: { $sum: "$production.value" },
          totalArea: { $sum: "$areaCultivated.value" },
          avgYield: { $avg: "$yield.value" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id",
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Calculate growth rates
    const trendsWithGrowth = trends.map((item, index) => {
      if (index === 0) return { ...item, growthRate: 0 };
      const growthRate = calculateGrowthRate(
        item.production,
        trends[index - 1].production
      );
      return { ...item, growthRate: parseFloat(growthRate) };
    });

    // If district, get ranking within province
    let rankingData = null;
    if (regionType === "district") {
      const provinceCode = regionDetails.provinceCode;
      const districtRankings = await ProductionData.aggregate([
        {
          $match: {
            provinceCode: provinceCode,
            level: "district",
            ...(year && { year }),
          },
        },
        {
          $group: {
            _id: "$districtCode",
            totalProduction: { $sum: "$production.value" },
          },
        },
        { $sort: { totalProduction: -1 } },
      ]);

      const districtRank =
        districtRankings.findIndex((d) => d._id === regionCode.toUpperCase()) +
        1;

      rankingData = {
        rank: districtRank,
        totalDistricts: districtRankings.length,
        percentile: Math.round(
          (1 - districtRank / districtRankings.length) * 100
        ),
      };
    }

    const overall =
      overallMetrics.length > 0
        ? overallMetrics[0]
        : {
            totalProduction: 0,
            totalArea: 0,
            avgYield: 0,
          };

    return ApiResponse.success(
      res,
      {
        region: {
          type: regionType,
          code: regionCode.toUpperCase(),
          name: regionDetails.name,
          ...(regionType === "district" && {
            province: regionDetails.province?.name,
            provinceCode: regionDetails.provinceCode,
          }),
          population: regionDetails.population,
          area: regionDetails.area,
        },
        overall: {
          production: Math.round(overall.totalProduction * 100) / 100,
          area: Math.round(overall.totalArea * 100) / 100,
          yield: Math.round(overall.avgYield * 1000) / 1000,
        },
        cropBreakdown,
        trends: trendsWithGrowth,
        ...(rankingData && { ranking: rankingData }),
      },
      "Regional performance data retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rank districts by metric
 * @route   GET /api/regional/district-rankings
 * @access  Public
 */
export const getDistrictRankings = async (req, res, next) => {
  try {
    const {
      year,
      crop,
      province,
      metric = "production",
      limit = 20,
    } = req.query;

    const matchStage = { level: "district" };
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (province) matchStage.provinceCode = province.toUpperCase();

    const metricField =
      metric === "yield"
        ? "$yield.value"
        : metric === "area"
        ? "$areaCultivated.value"
        : "$production.value";

    const rankings = await ProductionData.aggregate([
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
          provinceCode: { $first: "$provinceCode" },
          metricValue:
            metric === "yield" ? { $avg: metricField } : { $sum: metricField },
        },
      },
      { $sort: { metricValue: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          districtCode: "$_id",
          districtName: 1,
          provinceName: 1,
          provinceCode: 1,
          [metric]: { $round: ["$metricValue", metric === "yield" ? 3 : 2] },
        },
      },
    ]);

    // Add rank numbers
    const rankedData = rankings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return ApiResponse.success(
      res,
      {
        rankings: rankedData,
        metric,
        filters: {
          year: year || "all",
          crop: crop || "all",
          province: province || "all",
        },
      },
      "District rankings retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get provincial summary with all metrics
 * @route   GET /api/regional/provincial-summary
 * @access  Public
 */
export const getProvincialSummary = async (req, res, next) => {
  try {
    const { year, crop } = req.query;

    const matchStage = { level: "provincial" };
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();

    const summary = await ProductionData.aggregate([
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
          population: { $first: "$provinceInfo.population" },
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
          population: 1,
          production: { $round: ["$totalProduction", 2] },
          area: { $round: ["$totalArea", 2] },
          yield: { $round: ["$avgYield", 3] },
        },
      },
    ]);

    // Calculate shares
    const totalProduction = summary.reduce((sum, p) => sum + p.production, 0);
    const totalArea = summary.reduce((sum, p) => sum + p.area, 0);

    const withShares = summary.map((province) => ({
      ...province,
      productionShare: ((province.production / totalProduction) * 100).toFixed(
        2
      ),
      areaShare: ((province.area / totalArea) * 100).toFixed(2),
      productionPerCapita: (
        province.production /
        (province.population / 1000000)
      ).toFixed(2),
    }));

    return ApiResponse.success(
      res,
      {
        provinces: withShares,
        totals: {
          production: Math.round(totalProduction * 100) / 100,
          area: Math.round(totalArea * 100) / 100,
        },
      },
      "Provincial summary retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get year-over-year comparison for a region
 * @route   GET /api/regional/year-comparison/:regionType/:regionCode
 * @access  Public
 */
export const getYearOverYearComparison = async (req, res, next) => {
  try {
    const { regionType, regionCode } = req.params;
    const { crop } = req.query;

    const query = {};
    if (crop) query.cropCode = crop.toUpperCase();

    if (regionType === "province") {
      query.provinceCode = regionCode.toUpperCase();
      query.level = "provincial";
    } else if (regionType === "district") {
      query.districtCode = regionCode.toUpperCase();
      query.level = "district";
    } else {
      return ApiResponse.error(res, "Invalid region type", 400);
    }

    const yearData = await ProductionData.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$year",
          production: { $sum: "$production.value" },
          area: { $sum: "$areaCultivated.value" },
          yield: { $avg: "$yield.value" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id",
          production: { $round: ["$production", 2] },
          area: { $round: ["$area", 2] },
          yield: { $round: ["$yield", 3] },
        },
      },
    ]);

    // Calculate changes
    const withChanges = yearData.map((current, index) => {
      if (index === 0) {
        return {
          ...current,
          changes: {
            production: 0,
            area: 0,
            yield: 0,
          },
        };
      }

      const previous = yearData[index - 1];
      return {
        ...current,
        changes: {
          production: parseFloat(
            calculateGrowthRate(current.production, previous.production)
          ),
          area: parseFloat(calculateGrowthRate(current.area, previous.area)),
          yield: parseFloat(calculateGrowthRate(current.yield, previous.yield)),
        },
      };
    });

    return ApiResponse.success(
      res,
      withChanges,
      "Year-over-year comparison retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

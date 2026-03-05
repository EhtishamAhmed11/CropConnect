// Backend/controllers/prediction.controller.js
import YieldPrediction from "../models/yieldPrediction.model.js";
import ModelPerformance from "../models/modelPerformance.model.js";
import ProductionData from "../models/productionData.model.js";
import ApiResponse from "../utils/apiResponse.js";
import cache from "../services/cache.service.js";

/**
 * @desc    Get yield predictions for a crop and region
 * @route   GET /api/predictions/forecast
 * @access  Public
 */
export const getForecastData = async (req, res, next) => {
    try {
        const { crop, region, startYear, endYear } = req.query;

        if (!crop) {
            return ApiResponse.error(res, "Crop is required", 400);
        }

        // Cache check
        const cacheKey = cache.generateKey("forecast", { crop, region, startYear, endYear });
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return ApiResponse.success(res, cachedData, "Forecast data retrieved from cache");
        }

        const query = { crop };
        if (region) query.region = region;
        if (startYear) query.year = { $gte: parseInt(startYear) };
        if (endYear) query.year = { ...query.year, $lte: parseInt(endYear) };

        const predictions = await YieldPrediction.find(query)
            .sort({ year: 1 })
            .lean();

        // Store in cache
        cache.set(cacheKey, predictions);

        return ApiResponse.success(
            res,
            predictions,
            "Forecast data retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get combined historical + forecast data
 * @route   GET /api/predictions/timeline
 * @access  Public
 */
export const getTimelineData = async (req, res, next) => {
    try {
        const { crop, region } = req.query;

        if (!crop || !region) {
            return ApiResponse.error(res, "Crop and region are required", 400);
        }

        // Cache check
        const cacheKey = cache.generateKey("timeline", { crop, region });
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return ApiResponse.success(res, cachedData, "Timeline data retrieved from cache");
        }

        // Get historical data (2018-2024)
        const cropCode = crop.toUpperCase();
        const provinceCode = region === "Pakistan" ? null : region.substring(0, 2).toUpperCase();

        let historicalQuery = {
            cropCode,
            level: region === "Pakistan" ? "national" : "provincial",
        };

        if (provinceCode) {
            historicalQuery.provinceCode = provinceCode;
        }

        const historicalData = await ProductionData.find(historicalQuery)
            .sort({ year: 1 })
            .select("year production")
            .lean();

        // Get forecast data (2024-2033)
        const forecastData = await YieldPrediction.find({ crop, region })
            .sort({ year: 1 })
            .lean();

        // Format response
        const timeline = {
            historical: (historicalData || []).map((d) => ({
                year: d.year,
                production: d.production?.value || 0,
                unit: d.production?.unit || "tonnes",
                type: "actual",
            })),
            forecast: (forecastData || []).map((d) => ({
                year: d.year,
                production: d.predictedProduction?.value || 0,
                unit: d.predictedProduction?.unit || "tonnes",
                type: "predicted",
                modelR2: d.modelR2,
            })),
        };

        // Store in cache
        cache.set(cacheKey, timeline);

        return ApiResponse.success(
            res,
            timeline,
            "Timeline data retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get model performance metrics
 * @route   GET /api/predictions/performance
 * @access  Public
 */
export const getModelPerformance = async (req, res, next) => {
    try {
        const { crop, region } = req.query;

        const query = {};
        if (crop) query.crop = crop;
        if (region) query.region = region;

        const performance = await ModelPerformance.find(query).lean();

        return ApiResponse.success(
            res,
            performance,
            "Model performance retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get regional comparison for a specific year
 * @route   GET /api/predictions/regional-comparison
 * @access  Public
 */
export const getRegionalComparison = async (req, res, next) => {
    try {
        const { crop, year } = req.query;

        if (!crop || !year) {
            return ApiResponse.error(res, "Crop and year are required", 400);
        }

        const predictions = await YieldPrediction.find({
            crop,
            year: parseInt(year),
            region: { $ne: "Pakistan" }, // Exclude national level
        })
            .sort({ "predictedProduction.value": -1 })
            .lean();

        return ApiResponse.success(
            res,
            predictions,
            "Regional comparison retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get prediction summary statistics
 * @route   GET /api/predictions/summary
 * @access  Public
 */
export const getPredictionSummary = async (req, res, next) => {
    try {
        const { crop, region } = req.query;

        const matchStage = {};
        if (crop) matchStage.crop = crop;
        if (region) matchStage.region = region;

        const summary = await YieldPrediction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    avgPrediction: { $avg: "$predictedProduction.value" },
                    minPrediction: { $min: "$predictedProduction.value" },
                    maxPrediction: { $max: "$predictedProduction.value" },
                    avgR2: { $avg: "$modelR2" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const result = summary.length > 0 ? summary[0] : {};
        delete result._id;

        return ApiResponse.success(
            res,
            result,
            "Prediction summary retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
};

// Backend/controllers/prediction.controller.js
import YieldPrediction from "../models/yieldPrediction.model.js";
import ModelPerformance from "../models/modelPerformance.model.js";
import ActualVsPredicted from "../models/actualVsPredicted.model.js";
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

        let predictions;

        if (region === "Pakistan") {
            // Aggregate all 4 provinces for national-level view
            predictions = await aggregateNationalForecast(crop, startYear, endYear);
        } else {
            const query = { crop };
            if (region) query.region = region;
            if (startYear) query.year = { $gte: parseInt(startYear) };
            if (endYear) query.year = { ...query.year, $lte: parseInt(endYear) };

            predictions = await YieldPrediction.find(query)
                .sort({ year: 1 })
                .lean();
        }

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

        // Get historical predictions from ActualVsPredicted (backtest data)
        let historicalPredictions;
        if (region === "Pakistan") {
            const rawAvp = await ActualVsPredicted.find({ crop }).lean();
            const yearlyMap = {};
            rawAvp.forEach((r) => {
                const yr = r.year;
                if (!yearlyMap[yr]) yearlyMap[yr] = 0;
                yearlyMap[yr] += r.predictedProduction;
            });
            historicalPredictions = Object.entries(yearlyMap).map(([yr, val]) => ({
                year: parseInt(yr),
                production: val,
            }));
        } else {
            const rawAvp = await ActualVsPredicted.find({ crop, region }).lean();
            historicalPredictions = rawAvp.map((r) => ({
                year: r.year,
                production: r.predictedProduction,
            }));
        }

        // Get forecast data (2024-2033)
        let forecastData;
        if (region === "Pakistan") {
            forecastData = await aggregateNationalForecast(crop);
        } else {
            forecastData = await YieldPrediction.find({ crop, region })
                .sort({ year: 1 })
                .lean();
        }

        // Format response
        const timeline = {
            historical: (historicalData || []).map((d) => {
                // Handle "2023-24" string format by extracting the start year
                let yearVal = d.year;
                if (typeof yearVal === "string" && yearVal.includes("-")) {
                    yearVal = parseInt(yearVal.split("-")[0]);
                } else if (typeof yearVal === "string") {
                    yearVal = parseInt(yearVal);
                }
                
                return {
                    year: yearVal,
                    production: d.production?.value || 0,
                    unit: d.production?.unit || "tonnes",
                    type: "actual",
                };
            }),
            forecast: []
        };

        // Merge historical predictions with future forecasts into a single timeline
        const forecastMap = {};
        
        // 1. Load historical predictions
        historicalPredictions.forEach((hp) => {
            forecastMap[hp.year] = {
                year: hp.year,
                production: hp.production,
                unit: "thousand tonnes",
                type: "predicted",
                modelR2: null,
                confidenceInterval: null,
                forecastWeather: null,
            };
        });

        // 2. Load and overlay future forecasts
        (forecastData || []).forEach((d) => {
            forecastMap[d.year] = {
                year: d.year,
                production: d.predictedProduction?.value || 0,
                unit: d.predictedProduction?.unit || "thousand tonnes",
                type: "predicted",
                modelR2: d.modelR2,
                confidenceInterval: d.confidenceInterval || null,
                forecastWeather: d.forecastWeather || null,
            };
        });

        timeline.forecast = Object.values(forecastMap).sort((a, b) => a.year - b.year);

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
        if (region && region !== "Pakistan") query.region = region;

        const performance = await ModelPerformance.find(query).lean();

        // If Pakistan: return an averaged summary across all provinces
        if (region === "Pakistan" && performance.length > 0) {
            const avgPerformance = {
                crop: crop || "All",
                region: "Pakistan",
                bestModel: "Ensemble (averaged)",
                testR2: avg(performance, "testR2"),
                cvR2: avg(performance, "cvR2"),
                testRMSE: avg(performance, "testRMSE"),
                testMAE: avg(performance, "testMAE"),
                mape: avg(performance, "mape"),
            };
            return ApiResponse.success(res, [avgPerformance], "Model performance retrieved successfully");
        }

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
 * @desc    Get actual vs predicted (backtest validation data from ML model)
 * @route   GET /api/predictions/actual-vs-predicted
 * @access  Public
 */
export const getActualVsPredicted = async (req, res, next) => {
    try {
        const { crop, region } = req.query;

        if (!crop || !region) {
            return ApiResponse.error(res, "Crop and region are required", 400);
        }

        const cacheKey = cache.generateKey("avp", { crop, region });
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return ApiResponse.success(res, cachedData, "Actual vs predicted data from cache");
        }

        let data;
        if (region === "Pakistan") {
            // Aggregate all provinces per year
            data = await ActualVsPredicted.aggregate([
                { $match: { crop } },
                {
                    $group: {
                        _id: "$year",
                        actualProduction:    { $sum: "$actualProduction" },
                        predictedProduction: { $sum: "$predictedProduction" },
                    },
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        _id: 0,
                        year: "$_id",
                        actualProduction: { $round: ["$actualProduction", 2] },
                        predictedProduction: { $round: ["$predictedProduction", 2] },
                        errorKt: {
                            $round: [{ $subtract: ["$actualProduction", "$predictedProduction"] }, 2],
                        },
                        errorPct: {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                { $abs: { $subtract: ["$actualProduction", "$predictedProduction"] } },
                                                { $add: [{ $abs: "$actualProduction" }, 0.0001] },
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                2,
                            ],
                        },
                    },
                },
            ]);
        } else {
            data = await ActualVsPredicted.find({ crop, region })
                .sort({ year: 1 })
                .lean();
        }

        cache.set(cacheKey, data);

        return ApiResponse.success(
            res,
            data,
            "Actual vs predicted data retrieved successfully"
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
        if (region && region !== "Pakistan") matchStage.region = region;

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

// ── Helper: aggregate 4 provinces into national-level forecast ───────────────
async function aggregateNationalForecast(crop, startYear, endYear) {
    const matchStage = { crop };
    if (startYear || endYear) {
        matchStage.year = {};
        if (startYear) matchStage.year.$gte = parseInt(startYear);
        if (endYear)   matchStage.year.$lte = parseInt(endYear);
    }

    const agg = await YieldPrediction.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$year",
                totalProduction: { $sum: "$predictedProduction.value" },
                lower80: { $sum: "$confidenceInterval.lower80" },
                upper80: { $sum: "$confidenceInterval.upper80" },
                lower95: { $sum: "$confidenceInterval.lower95" },
                upper95: { $sum: "$confidenceInterval.upper95" },
                avgR2:   { $avg: "$modelR2" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return agg.map((d) => ({
        crop,
        region: "Pakistan",
        year: d._id,
        predictedProduction: {
            value: parseFloat(d.totalProduction.toFixed(3)),
            unit: "thousand tonnes",
        },
        confidenceInterval: {
            lower80: parseFloat(d.lower80.toFixed(3)),
            upper80: parseFloat(d.upper80.toFixed(3)),
            lower95: parseFloat(d.lower95.toFixed(3)),
            upper95: parseFloat(d.upper95.toFixed(3)),
        },
        modelR2: parseFloat(d.avgR2.toFixed(4)),
        modelType: "Aggregated",
    }));
}

// ── Helper: average a numeric field across an array ─────────────────────────
function avg(arr, field) {
    if (!arr.length) return 0;
    const sum = arr.reduce((acc, item) => acc + (item[field] || 0), 0);
    return parseFloat((sum / arr.length).toFixed(4));
}

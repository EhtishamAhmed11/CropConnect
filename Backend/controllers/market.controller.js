import mongoose from "mongoose";
import MarketPrice from "../models/marketPrice.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";
import cache from "../services/cache.service.js";
import ApiResponse from "../utils/apiResponse.js";
import { getForecastForCropDistrict, getAllForecastsForDistrict } from "../services/marketForecast.service.js";

// @desc    Get latest market prices for all crops (optionally filtered by district)
// @route   GET /api/market/prices/latest
// @access  Public
export const getLatestPrices = async (req, res, next) => {
    try {
        const { district } = req.query;

        // Cache check
        const cacheKey = cache.generateKey("market_latest", { district });
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return ApiResponse.success(res, cachedData, "Latest market prices retrieved from cache");
        }

        // BUG 1 FIX: Build pipeline dynamically so district filter is actually applied
        const pipeline = [];

        if (district) {
            pipeline.push({
                $match: { district: new mongoose.Types.ObjectId(district) }
            });
        }

        pipeline.push(
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: "$cropType",
                    price: { $first: "$price" },
                    district: { $first: "$district" },
                    date: { $first: "$date" },
                    source: { $first: "$source" },
                    unit: { $first: "$unit" }
                }
            },
            {
                $lookup: {
                    from: "croptypes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "cropDetails"
                }
            },
            { $unwind: "$cropDetails" },
            {
                $project: {
                    cropId: "$_id",
                    crop: "$cropDetails.name",
                    price: 1,
                    unit: 1,
                    date: 1,
                    source: 1,
                    district: 1
                }
            }
        );

        const prices = await MarketPrice.aggregate(pipeline);

        // Populate district name
        await District.populate(prices, { path: "district", select: "name" });

        // Store in cache
        cache.set(cacheKey, prices);

        return ApiResponse.success(res, prices, "Latest market prices retrieved successfully");
    } catch (error) {
        next(error);
    }
};

// @desc    Get historical price trends for a specific crop and district
// @route   GET /api/market/prices/history
// @access  Public
export const getPriceHistory = async (req, res, next) => {
    try {
        const { cropId, districtId, days = 30 } = req.query;

        if (!cropId || !districtId) {
            return res.status(400).json({ success: false, message: "Please provide cropId and districtId" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const history = await MarketPrice.find({
            cropType: cropId,
            district: districtId,
            date: { $gte: startDate }
        })
            .sort({ date: 1 })  // ascending so chart renders left-to-right
            .select("date price source");

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Add new market price (Ingestion endpoint)
// @route   POST /api/market/prices
// @access  Admin/System
export const addMarketPrice = async (req, res, next) => {
    try {
        const { cropType, district, price, date, source, unit, marketType, currency } = req.body;

        const marketPrice = await MarketPrice.create({
            cropType,
            district,
            price,
            date: date || Date.now(),
            source,
            unit,
            marketType,
            currency
        });

        // BUG 2 FIX: Clear ALL cache entries with relevant prefixes instead of hardcoded keys.
        // cache.generateKey produces keys like "market_latest:{"district":"..."}" or
        // "market_latest:{}" — a simple prefix scan clears all variants correctly.
        cache.deleteByPrefix("market_latest");
        cache.deleteByPrefix("market_highlights");

        res.status(201).json({
            success: true,
            data: marketPrice
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get market highlights (stats for dashboard)
// @route   GET /api/market/highlights
// @access  Public
export const getMarketHighlights = async (req, res, next) => {
    try {
        // Cache check
        const cacheKey = cache.generateKey("market_highlights", {});
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return ApiResponse.success(res, cachedData, "Market highlights retrieved from cache");
        }

        // 1. Get latest price for Wheat
        // BUG 3 FIX: Use case-insensitive regex so "Wheat", "WHEAT", "wheat" all match
        const wheat = await CropType.findOne({ name: { $regex: /^wheat$/i } });
        let avgWheatPrice = 4250;
        if (wheat) {
            const latestWheat = await MarketPrice.findOne({ cropType: wheat._id }).sort({ date: -1 });
            if (latestWheat) avgWheatPrice = latestWheat.price;
        }

        // 2. Identify Top Gainer
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const gains = await MarketPrice.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { $sort: { date: 1 } },
            {
                $group: {
                    _id: "$cropType",
                    oldPrice: { $first: "$price" },
                    newPrice: { $last: "$price" }
                }
            },
            {
                $project: {
                    gain: {
                        $cond: [
                            { $eq: ["$oldPrice", 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: [{ $subtract: ["$newPrice", "$oldPrice"] }, "$oldPrice"] },
                                    100
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { gain: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "croptypes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "crop"
                }
            },
            { $unwind: "$crop" }
        ]);

        const topGainer = gains.length > 0
            ? { name: gains[0].crop.name, gain: parseFloat(gains[0].gain.toFixed(1)) }
            : { name: "Cotton", gain: 5.1 };

        // 3. BUG 4 FIX: Volatile Crop now uses coefficient of variation (stdDev / mean)
        // instead of entry count, so it measures actual price fluctuation
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const volatility = await MarketPrice.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: "$cropType",
                    avgPrice: { $avg: "$price" },
                    stdDev: { $stdDevPop: "$price" },
                    count: { $sum: 1 }
                }
            },
            // Need at least 2 data points to measure volatility
            { $match: { count: { $gte: 2 } } },
            {
                $project: {
                    // Coefficient of variation as percentage: higher = more volatile
                    volatilityPct: {
                        $cond: [
                            { $eq: ["$avgPrice", 0] },
                            0,
                            { $multiply: [{ $divide: ["$stdDev", "$avgPrice"] }, 100] }
                        ]
                    },
                    count: 1
                }
            },
            { $sort: { volatilityPct: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "croptypes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "crop"
                }
            },
            { $unwind: "$crop" }
        ]);

        const volatileCrop = volatility.length > 0
            ? {
                name: volatility[0].crop.name,
                // BUG 7 FIX: Return actual volatility percentage instead of hardcoding
                volatilityPct: parseFloat(volatility[0].volatilityPct.toFixed(1))
            }
            : { name: "Maize", volatilityPct: 0 };

        const result = {
            avgWheatPrice,
            topGainer,
            volatileCrop
        };

        // Store in cache
        cache.set(cacheKey, result);

        return ApiResponse.success(res, result, "Market highlights retrieved successfully");
    } catch (error) {
        next(error);
    }
};


// @desc    Get price forecast for a specific crop + district
// @route   GET /api/market/forecast?cropId=...&districtId=...
// @access  Public
// @returns basePrice, 10/20/30-day forecasts with confidence bands,
//          factor breakdown (seasonal/weather/supply), trend, summary
export const getPriceForecast = async (req, res, next) => {
    try {
        const { cropId, districtId } = req.query;

        if (!cropId || !districtId) {
            return res.status(400).json({
                success: false,
                message: "Please provide cropId and districtId",
            });
        }

        // Cache per crop+district pair (1 hour — forecasts are generated daily)
        const cacheKey = cache.generateKey("market_forecast", { cropId, districtId });
        const cached = cache.get(cacheKey);
        if (cached) {
            return ApiResponse.success(res, cached, "Price forecast retrieved from cache");
        }

        const forecast = await getForecastForCropDistrict(cropId, districtId);

        if (!forecast) {
            return res.status(404).json({
                success: false,
                message: "No forecast available yet. Forecasts are generated daily at 6:30 AM.",
            });
        }

        cache.set(cacheKey, forecast, 3600); // cache for 1 hour
        return ApiResponse.success(res, forecast, "Price forecast retrieved successfully");
    } catch (error) {
        next(error);
    }
};

// @desc    Get price forecasts for all crops in a district
// @route   GET /api/market/forecast/district/:districtId
// @access  Public
// @returns Array of forecasts for Wheat, Rice, Cotton in the given district
export const getDistrictForecasts = async (req, res, next) => {
    try {
        const { districtId } = req.params;

        const cacheKey = cache.generateKey("market_forecast_district", { districtId });
        const cached = cache.get(cacheKey);
        if (cached) {
            return ApiResponse.success(res, cached, "District forecasts retrieved from cache");
        }

        const forecasts = await getAllForecastsForDistrict(districtId);

        if (!forecasts.length) {
            return res.status(404).json({
                success: false,
                message: "No forecasts available for this district yet.",
            });
        }

        // Deduplicate — keep only the latest forecast per crop
        const seen = new Set();
        const latest = forecasts.filter(f => {
            const key = f.cropType._id.toString();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        cache.set(cacheKey, latest, 3600);
        return ApiResponse.success(res, latest, "District price forecasts retrieved successfully");
    } catch (error) {
        next(error);
    }
};
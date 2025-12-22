import MarketPrice from "../models/marketPrice.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";

// @desc    Get latest market prices for all crops (optionally filtered by district)
// @route   GET /api/market/prices/latest
// @access  Public
export const getLatestPrices = async (req, res, next) => {
    try {
        const { district } = req.query;

        // Build query match stage
        const matchStage = {};
        if (district) {
            matchStage.district = district; // Assuming district ID passed
        }

        // Aggregation to get the latest price per crop
        const prices = await MarketPrice.aggregate([
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
        ]);

        // Populate district name if needed (optional optimization)
        await District.populate(prices, { path: "district", select: "name" });

        console.log("Latest Prices Data Sample:", prices.length > 0 ? prices[0] : "No Data");

        res.status(200).json({
            success: true,
            count: prices.length,
            data: prices
        });
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
            .sort({ date: 1 })
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
        const { cropType, district, price, date, source } = req.body;

        const marketPrice = await MarketPrice.create({
            cropType,
            district,
            price,
            date: date || Date.now(),
            source
        });

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
        // 1. Get average price for Wheat (Major crop)
        const wheat = await CropType.findOne({ name: "WHEAT" });
        let avgWheatPrice = 4250; // Fallback
        if (wheat) {
            const latestWheat = await MarketPrice.findOne({ cropType: wheat._id }).sort({ date: -1 });
            if (latestWheat) avgWheatPrice = latestWheat.price;
        }

        // 2. Identify Top Gainer (compared to 7 days ago)
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
                            { $multiply: [{ $divide: [{ $subtract: ["$newPrice", "$oldPrice"] }, "$oldPrice"] }, 100] }
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

        const topGainer = gains.length > 0 ? {
            name: gains[0].crop.name,
            gain: gains[0].gain.toFixed(1)
        } : { name: "Cotton", gain: "5.1" };

        // 3. Volatile Crop (most price variations in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const volatility = await MarketPrice.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: "$cropType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
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

        const volatileCrop = volatility.length > 0 ? volatility[0].crop.name : "Maize";

        res.status(200).json({
            success: true,
            data: {
                avgWheatPrice,
                topGainer,
                volatileCrop
            }
        });
    } catch (error) {
        next(error);
    }
};

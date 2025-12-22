import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDb from "../connection/db.connection.js";
import District from "../models/district.model.js";
import CropType from "../models/cropType.model.js";
import MarketPrice from "../models/marketPrice.model.js";

const seedMarketData = async () => {
    if (mongoose.connection.readyState === 0) {
        await connectDb();
    }

    try {
        await MarketPrice.deleteMany({}); // Clear existing for test
        console.log("Cleared existing market data.");

        const districts = await District.find().limit(5); // Pick 5 districts
        if (districts.length === 0) throw new Error("No districts found. Run basic seeds first.");

        const cropsList = [
            {
                name: "Wheat",
                code: "WHT",
                variety: "Generic",
                category: "grain",
                season: "rabi",
                avgConsumptionPerCapita: 120,
                basePrice: 4200
            },
            {
                name: "Cotton",
                code: "CTN",
                variety: "Bt Cotton",
                category: "cash_crop",
                season: "kharif",
                avgConsumptionPerCapita: 5,
                basePrice: 8500
            },
            {
                name: "Rice",
                code: "RIC",
                variety: "Basmati",
                category: "grain",
                season: "kharif",
                avgConsumptionPerCapita: 15,
                basePrice: 3800
            },
            {
                name: "Sugarcane",
                code: "SGC",
                variety: "High Yield",
                category: "cash_crop",
                season: "kharif",
                avgConsumptionPerCapita: 20,
                basePrice: 450
            },
            {
                name: "Maize",
                code: "MZE",
                variety: "Hybrid",
                category: "grain",
                season: "both",
                avgConsumptionPerCapita: 10,
                basePrice: 2200
            }
        ];

        const dbCrops = [];
        for (const c of cropsList) {
            let crop = await CropType.findOne({ name: { $regex: new RegExp(c.name, "i") } });
            if (!crop) {
                // Try to find by code if name fails or just create
                crop = await CropType.findOne({ code: c.code });
            }

            if (!crop) {
                crop = await CropType.create({
                    name: c.name,
                    code: c.code,
                    variety: c.variety,
                    category: c.category,
                    season: c.season,
                    avgConsumptionPerCapita: c.avgConsumptionPerCapita
                });
                console.log(`Created crop: ${c.name}`);
            }
            dbCrops.push({ ...crop.toObject(), basePrice: c.basePrice });
        }

        const prices = [];
        const today = new Date();

        for (const district of districts) {
            for (const crop of dbCrops) {
                // Generate 30 days of history for specific crop/district combo
                for (let i = 0; i < 30; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);

                    // Add some random variance to price (volatility)
                    const volatility = (Math.random() * 0.1) - 0.05; // +/- 5%
                    const price = Math.round(crop.basePrice * (1 + volatility));

                    prices.push({
                        cropType: crop._id,
                        district: district._id,
                        price: price,
                        date: date,
                        source: "Market Committee",
                        unit: "40kg"
                    });
                }
            }
        }

        await MarketPrice.insertMany(prices);
        console.log(`✅ Seeded ${prices.length} market price records (${dbCrops.length} crops x ${districts.length} districts x 30 days).`);

    } catch (error) {
        console.error("Seeding failed:", error);
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedMarketData().then(async () => {
        await mongoose.connection.close();
        process.exit(0);
    });
}

export default seedMarketData;  
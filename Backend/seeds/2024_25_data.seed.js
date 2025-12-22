import mongoose from "mongoose";
import District from "../models/district.model.js";
import CropType from "../models/cropType.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";

const RAW_DATA_2024_25 = {
    COTTON: [
        { name: "Sargodha", area: 4, production: 7 }, // Total from Page 1 & 2
        { name: "Khushab", area: 2, production: 2 },
        { name: "Mianwali", area: 102, production: 129 },
        { name: "Bhakkar", area: 33, production: 39 },
        { name: "Faisalabad", area: 28, production: 47 },
        { name: "Toba Tek Singh", area: 34, production: 36 },
        { name: "Jhang", area: 36, production: 48 },
        { name: "Chiniot", area: 1, production: 1 },
        { name: "Kasur", area: 3, production: 2 },
        { name: "Okara", area: 8, production: 15 },
        { name: "Sahiwal", area: 51, production: 96 },
        { name: "Pakpattan", area: 11, production: 17 },
        { name: "Multan", area: 201, production: 280 },
        { name: "Lodhran", area: 218, production: 290 },
        { name: "Khanewal", area: 174, production: 266 },
        { name: "Vehari", area: 124, production: 187 },
        { name: "Muzaffargarh", area: 104, production: 80 },
        { name: "Kot Addu", area: 22, production: 18 },
        { name: "Layyah", area: 85, production: 44 },
        { name: "Dera Ghazi Khan", area: 28, production: 34 },
        { name: "Taunsa", area: 29, production: 28 },
        { name: "Rajanpur", area: 184, production: 172 },
        { name: "Bahawalpur", area: 579, production: 703 },
        { name: "Rahim Yar Khan", area: 482, production: 460 },
        { name: "Bahawalnagar", area: 674, production: 836 },
    ],
    RICE: [
        { name: "Jhelum", area: 6, production: 4.0 },
        { name: "Sargodha", area: 151, production: 109.6 },
        { name: "Khushab", area: 42, production: 29.8 },
        { name: "Mianwali", area: 8, production: 6.2 },
        { name: "Bhakkar", area: 9, production: 7.4 },
        { name: "Faisalabad", area: 113, production: 83.7 },
        { name: "Toba Tek Singh", area: 123, production: 105.8 },
        { name: "Jhang", area: 475, production: 368.2 },
        { name: "Chiniot", area: 120, production: 90.9 },
        { name: "Gujrat", area: 88, production: 59.9 },
        { name: "Mandi Bahauddin", area: 250, production: 145.5 },
        { name: "Hafizabad", area: 390, production: 284.4 },
        { name: "Gujranwala", area: 426, production: 98.7 },
        { name: "Sialkot", area: 488, production: 282.9 },
        { name: "Narowal", area: 206, production: 162.0 },
        { name: "Sheikhupura", area: 587, production: 486.7 },
        { name: "Nankana Sahib", area: 285, production: 250.2 },
        { name: "Lahore", area: 71, production: 39.4 },
        { name: "Kasur", area: 281, production: 57.6 },
        { name: "Okara", area: 417, production: 293.0 },
        { name: "Sahiwal", area: 152, production: 138.7 },
        { name: "Pakpattan", area: 304, production: 273.3 },
        { name: "Multan", area: 101, production: 63.8 },
        { name: "Lodhran", area: 53, production: 32.6 },
        { name: "Khanewal", area: 188, production: 150.1 },
        { name: "Vehari", area: 159, production: 111.9 },
        { name: "Muzaffargarh", area: 81, production: 44.3 },
        { name: "Kot Addu", area: 18, production: 7.7 },
        { name: "Layyah", area: 4, production: 3.4 },
        { name: "Dera Ghazi Khan", area: 190, production: 14.4 },
        { name: "Rajanpur", area: 95, production: 3.3 },
        { name: "Bahawalpur", area: 69, production: 43.6 },
        { name: "Rahim Yar Khan", area: 187, production: 112.9 },
        { name: "Bahawalnagar", area: 378, production: 286.7 },
    ],
    WHEAT: [
        { name: "Sargodha", area: 450, production: 1200 },
        { name: "Faisalabad", area: 500, production: 1400 },
        { name: "Multan", area: 300, production: 900 },
        { name: "Bahawalpur", area: 600, production: 1800 },
        { name: "Hafizabad", area: 200, production: 600 },
        { name: "Gujranwala", area: 400, production: 1100 },
        { name: "Sialkot", area: 350, production: 950 },
        { name: "Sheikhupura", area: 450, production: 1300 },
        { name: "Okara", area: 380, production: 1050 },
        { name: "Sahiwal", area: 320, production: 920 },
    ]
};

const CONVERSION = {
    ACRE_TO_HECTARE: 0.4047,
    COTTON_BALE_TO_TONNE: 0.170, // 1 bale = 170kg lint
    KILO_TO_TONNE: 0.001
};

const seed2024Data = async () => {
    try {
        console.log("🌱 Starting 2024-25 Data Seeding...");

        // 1. Get Crop Types
        const cottonType = await CropType.findOne({ code: "COTTON" });
        const riceType = await CropType.findOne({ code: "RICE" });

        if (!cottonType || !riceType) {
            throw new Error("Required crop types (COTTON, RICE) not found in DB.");
        }

        const year = "2024-25";

        // Clear existing REAL records for this year (keep Estimated ones from other provinces)
        await ProductionData.deleteMany({ year, dataSource: "Provincial_CRS" });
        await SurplusDeficit.deleteMany({ year, provinceCode: "PB" });

        const districts = await District.find({ isActive: true });

        const DISTRICT_MAPPING = {
            "Pakpattan": "Sahiwal",
            "Kot Addu": "Muzaffargarh",
            "Taunsa": "Dera Ghazi Khan",
            "Wazirabad": "Gujranwala",
            "T.T. Singh": "Toba Tek Singh",
            "M.B.Din": "Mandi Bahauddin",
            "D.G. Khan": "Dera Ghazi Khan",
            "Rajan Pur": "Rajanpur",
            "Muzzafargargh": "Muzaffargarh"
        };

        const processCrop = async (cropCode, rawData, cropType) => {
            console.log(`Processing ${cropCode}...`);
            for (const item of rawData) {
                const mappedName = DISTRICT_MAPPING[item.name] || item.name;

                // Find matching district
                const district = districts.find(d =>
                    d.name.toLowerCase() === mappedName.toLowerCase()
                );

                if (!district) {
                    console.warn(`District not found: ${item.name}. Skipping...`);
                    continue;
                }

                // Conversions
                const areaHectares = item.area * 1000 * CONVERSION.ACRE_TO_HECTARE;
                let productionTonnes;
                if (cropCode === "COTTON") {
                    productionTonnes = item.production * 1000 * CONVERSION.COTTON_BALE_TO_TONNE;
                } else {
                    productionTonnes = item.production * 1000; // Rice already in '000 tons
                }

                const yieldVal = areaHectares > 0 ? productionTonnes / areaHectares : 0;

                // Save Production Data
                const prodEntry = await ProductionData.create({
                    year,
                    cropYear: { startYear: 2024, endYear: 2025 },
                    level: "district",
                    district: district._id,
                    districtCode: district.code,
                    province: district.province,
                    provinceCode: district.provinceCode,
                    cropType: cropType._id,
                    cropCode: cropType.code,
                    cropName: cropType.name,
                    areaCultivated: { value: areaHectares, unit: "hectares" },
                    production: { value: productionTonnes, unit: "tonnes" },
                    yield: { value: yieldVal, unit: "tonnes_per_hectare" },
                    dataSource: "Provincial_CRS",
                    dataSourceDetails: "Crop Reporting Service, Agriculture Deptt, Punjab"
                });

                // Calculate Consumption & Surplus/Deficit
                const consumption = (district.population || 0) * cropType.avgConsumptionPerCapita * CONVERSION.KILO_TO_TONNE;
                const balance = productionTonnes - consumption;
                const status = balance > 1000 ? "surplus" : balance < -1000 ? "deficit" : "balanced";

                let severity = "none";
                if (status === "deficit") {
                    const ratio = productionTonnes / consumption;
                    if (ratio < 0.5) severity = "critical";
                    else if (ratio < 0.8) severity = "moderate";
                    else severity = "mild";
                }

                await SurplusDeficit.create({
                    year,
                    level: "district",
                    district: district._id,
                    districtCode: district.code,
                    province: district.province,
                    provinceCode: district.provinceCode,
                    cropType: cropType._id,
                    cropCode: cropType.code,
                    production: productionTonnes,
                    consumption: consumption,
                    balance: balance,
                    status,
                    severity,
                    surplusDeficitPercentage: consumption > 0 ? (balance / consumption) * 100 : 0,
                    selfSufficiencyRatio: consumption > 0 ? (productionTonnes / consumption) * 100 : 0,
                    calculatedAt: new Date()
                });
            }
        };

        await processCrop("COTTON", RAW_DATA_2024_25.COTTON, cottonType);
        await processCrop("RICE", RAW_DATA_2024_25.RICE, riceType);

        const wheatType = await CropType.findOne({ code: "WHEAT" });
        if (wheatType) {
            await processCrop("WHEAT", RAW_DATA_2024_25.WHEAT, wheatType);
        }

        console.log("✅ 2024-25 Data Seeding Complete.");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        throw error;
    }
};

export default seed2024Data;

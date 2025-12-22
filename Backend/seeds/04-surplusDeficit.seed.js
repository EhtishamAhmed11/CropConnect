import mongoose from "mongoose";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import District from "../models/district.model.js";
import Province from "../models/province.model.js";
import CropType from "../models/cropType.model.js";
import ProductionData from "../models/productionData.model.js";

// Helper function to generate realistic production data
const generateProductionData = (district, crop, year) => {
    // Base production varies by district size and agricultural zone
    const baseProduction = {
        high_productivity: { min: 40000, max: 100000 },
        medium_productivity: { min: 20000, max: 50000 },
        low_productivity: { min: 5000, max: 20000 },
    };

    const zone = district.agriculturalZone || "medium_productivity";
    const range = baseProduction[zone] || baseProduction.medium_productivity;

    // Random production within range
    const production = Math.floor(
        Math.random() * (range.max - range.min) + range.min
    );

    // Consumption based on population (kg per person per year)
    const consumptionPerPerson = {
        WHEAT: 124, // kg/person/year
        RICE: 24,
        COTTON: 5,
    };

    const cropCode = (crop || "").toUpperCase();
    const rate = consumptionPerPerson[cropCode] || 10; // Default to 10 if unknown
    const population = district.population || 500000; // Default if missing

    const consumption = Math.floor(
        (population * rate) / 1000 // Convert to tons
    ) || 1000;

    const balance = production - consumption;
    const selfSufficiencyRatio = consumption > 0 ? production / consumption : 0;
    const surplusDeficitPercentage = consumption > 0
        ? (balance / consumption) * 100
        : 0;

    // Determine status and severity
    let status, severity;
    if (balance > consumption * 0.1) {
        status = "surplus";
        severity = "none";
    } else if (balance < -consumption * 0.3) {
        status = "deficit";
        severity = "critical";
    } else if (balance < 0) {
        status = "deficit";
        severity = "moderate";
    } else {
        status = "balanced";
        severity = "none";
    }

    const yieldRange = {
        WHEAT: { min: 2.0, max: 4.5 },
        RICE: { min: 1.5, max: 3.5 },
        COTTON: { min: 0.5, max: 1.5 }
    };

    const yieldRate = zone === "high_productivity"
        ? yieldRange[cropCode]?.max || 2.5
        : zone === "low_productivity"
            ? yieldRange[cropCode]?.min || 1.0
            : (yieldRange[cropCode]?.min + yieldRange[cropCode]?.max) / 2 || 1.8;

    const areaCultivated = production / yieldRate;

    return {
        production: production || 0,
        consumption: consumption || 0,
        balance: balance || 0,
        status,
        severity,
        areaCultivated: parseFloat(areaCultivated.toFixed(2)),
        yield: parseFloat(yieldRate.toFixed(2)),
        selfSufficiencyRatio: parseFloat((selfSufficiencyRatio || 0).toFixed(2)),
        surplusDeficitPercentage: parseFloat((surplusDeficitPercentage || 0).toFixed(2)),
    };
};

const seedSurplusDeficit = async () => {
    try {
        console.log("🌾 Starting Surplus/Deficit Seeding...");

        // Clear existing data
        await SurplusDeficit.deleteMany({});
        await ProductionData.deleteMany({ dataSource: "Estimated" });

        // Get all districts and provinces
        const districts = await District.find({}).lean();
        const provinces = await Province.find({}).lean();
        const crops = await CropType.find({}).lean();

        console.log(`Found ${districts.length} districts, ${provinces.length} provinces, ${crops.length} crops`);

        const years = ["2024-25", "2025-26"]; // Use agricultural year format
        const surplusDeficitData = [];

        // Generate data for each combination
        for (const year of years) {
            for (const crop of crops) {
                // District-level data
                for (const district of districts) {
                    const data = generateProductionData(district, crop.code, year);

                    // Create ProductionData first (calculator depends on it)
                    await ProductionData.create({
                        year,
                        cropYear: {
                            startYear: parseInt(year.split('-')[0]),
                            endYear: 2000 + parseInt(year.split('-')[1])
                        },
                        level: "district",
                        district: district._id,
                        districtCode: district.code,
                        province: district.province,
                        provinceCode: district.provinceCode,
                        cropType: crop._id,
                        cropCode: crop.code,
                        cropName: crop.name,
                        areaCultivated: { value: data.areaCultivated, unit: "hectares" },
                        production: { value: data.production, unit: "tonnes" },
                        yield: { value: data.yield, unit: "tonnes_per_hectare" },
                        dataSource: "Estimated",
                        reliability: "medium"
                    });

                    surplusDeficitData.push({
                        year,
                        cropCode: crop.code,
                        cropType: crop._id,
                        level: "district",
                        districtCode: district.code,
                        provinceCode: district.provinceCode,
                        district: district._id,
                        province: district.province,
                        production: data.production,
                        consumption: data.consumption,
                        balance: data.balance,
                        status: data.status,
                        severity: data.severity,
                        selfSufficiencyRatio: data.selfSufficiencyRatio,
                        surplusDeficitPercentage: data.surplusDeficitPercentage,
                    });
                }

                // Province-level data (aggregate from districts)
                for (const province of provinces) {
                    const provinceDistricts = districts.filter(
                        (d) => d.provinceCode === province.code
                    );

                    let provincialProd = 0;
                    let provincialCons = 0;

                    provinceDistricts.forEach(d => {
                        const dData = generateProductionData(d, crop.code, year);
                        provincialProd += (dData.production || 0);
                        provincialCons += (dData.consumption || 0);
                    });

                    const balance = provincialProd - provincialCons;
                    const selfSufficiencyRatio = provincialCons > 0
                        ? provincialProd / provincialCons
                        : 0;
                    const surplusDeficitPercentage = provincialCons > 0
                        ? (balance / provincialCons) * 100
                        : 0;

                    let status, severity;
                    if (balance > provincialCons * 0.1) {
                        status = "surplus";
                        severity = "none";
                    } else if (balance < -provincialCons * 0.3) {
                        status = "deficit";
                        severity = "critical";
                    } else if (balance < 0) {
                        status = "deficit";
                        severity = "moderate";
                    } else {
                        status = "balanced";
                        severity = "none";
                    }

                    surplusDeficitData.push({
                        year,
                        cropCode: crop.code,
                        cropType: crop._id,
                        level: "provincial",
                        provinceCode: province.code,
                        province: province._id,
                        production: provincialProd,
                        consumption: provincialCons,
                        balance: balance || 0,
                        status,
                        severity,
                        selfSufficiencyRatio: parseFloat((selfSufficiencyRatio || 0).toFixed(2)),
                        surplusDeficitPercentage: parseFloat((surplusDeficitPercentage || 0).toFixed(2)),
                    });
                }
            }
        }

        // Insert all data
        const inserted = await SurplusDeficit.insertMany(surplusDeficitData);
        console.log(`✅ Successfully seeded ${inserted.length} surplus/deficit records`);

        // Summary
        const summary = {
            years: years.length,
            crops: crops.length,
            districts: districts.length,
            provinces: provinces.length,
            totalRecords: inserted.length,
        };

        console.log("\n📊 Surplus/Deficit Summary:");
        console.log(`  - Years: ${summary.years}`);
        console.log(`  - Crops: ${summary.crops}`);
        console.log(`  - Districts: ${summary.districts}`);
        console.log(`  - Provinces: ${summary.provinces}`);
        console.log(`  - Total Records: ${summary.totalRecords}`);

        // Show sample data
        const sampleDistrict = inserted.find(r => r.level === "district");
        if (sampleDistrict) {
            console.log("\n📝 Sample District Record:");
            console.log(`  - District: ${sampleDistrict.districtCode}`);
            console.log(`  - Crop: ${sampleDistrict.cropCode}`);
            console.log(`  - Year: ${sampleDistrict.year}`);
            console.log(`  - Status: ${sampleDistrict.status}`);
            console.log(`  - Production: ${sampleDistrict.production.toLocaleString()} tons`);
            console.log(`  - Consumption: ${sampleDistrict.consumption.toLocaleString()} tons`);
            console.log(`  - Balance: ${sampleDistrict.balance.toLocaleString()} tons`);
        }

        return inserted;
    } catch (error) {
        console.error(`❌ Error seeding surplus/deficit: ${error.message}`);
        throw error;
    }
};

export default seedSurplusDeficit;

import mongoose from "mongoose";
import ProductionData from "../models/productionData.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";


export const fixGeoReferences = async () => {
    try {
        console.log("Connected to DB to fix geo references...");

        // 1. Build Maps
        const provinces = await Province.find({});
        const provinceMap = {};
        provinces.forEach(p => {
            provinceMap[p.code] = p._id; // Key: 'PB', Value: ObjectId
        });
        console.log(`Loaded ${provinces.length} provinces.`);

        const districts = await District.find({});
        const districtMap = {};
        districts.forEach(d => {
            districtMap[d.code] = d._id; // Key: 'LHR', Value: ObjectId
        });
        console.log(`Loaded ${districts.length} districts.`);

        // 2. Scan ProductionData
        const productions = await ProductionData.find({});
        console.log(`Scanning ${productions.length} production records...`);

        let updatedCount = 0;

        for (const prod of productions) {
            let isModified = false;

            // Fix Province
            if (prod.provinceCode) {
                const correctProvId = provinceMap[prod.provinceCode];
                if (correctProvId) {
                    if (!prod.province || prod.province.toString() !== correctProvId.toString()) {
                        prod.province = correctProvId;
                        isModified = true;
                    }
                } else {
                    console.warn(`Warning: Invalid provinceCode '${prod.provinceCode}' in record ${prod._id}`);
                }
            }

            // Fix District
            if (prod.districtCode) {
                const correctDistId = districtMap[prod.districtCode];
                if (correctDistId) {
                    if (!prod.district || prod.district.toString() !== correctDistId.toString()) {
                        prod.district = correctDistId;
                        isModified = true;
                    }
                } else {
                    // Some older data might have bad codes or nulls
                }
            }

            if (isModified) {
                await prod.save();
                updatedCount++;
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} records with correct Geo references.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Error fixing geo references:", error);
        process.exit(1);
    }
};

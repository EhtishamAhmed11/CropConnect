import path from "path";

import CSVImporter from "./csvImporter.js";
import ProductionData from "../../models/productionData.model.js";
import Province from "../../models/province.model.js";
import District from "../../models/district.model.js";
import CropType from "../../models/cropType.model.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const importCotton = async () => {
  try {
    console.log("🌱 Starting Cotton Production Data Import...");
    console.log("");
    const csvPath = path.join(
      __dirname,
      "../../data/Pakistan_Cotton_Production_Data_2018-2025_FINAL.csv"
    );
    console.log("Step 1: Parsing CSV file...");
    const importer = new CSVImporter(csvPath, "Cotton");
    await importer.parseCSV();

    importer.displayStats();
    importer.displayErrors(10);

    const validData = importer.getResults();

    if (validData.length === 0) {
      throw new Error("No valid data to import!");
    }

    // Step 2: Get reference data
    console.log("\nStep 2: Loading reference data...");

    const provinces = await Province.find({});
    const districts = await District.find({});
    const cropTypes = await CropType.find({});

    console.log(`  Found ${provinces.length} provinces`);
    console.log(`  Found ${districts.length} districts`);
    console.log(`  Found ${cropTypes.length} crop types`);

    // Create lookup maps
    const provinceMap = {};
    provinces.forEach((p) => {
      provinceMap[p.code] = p._id;
      provinceMap[p.name] = p._id;
    });

    const districtMap = {};
    districts.forEach((d) => {
      districtMap[`${d.provinceCode}-${d.name}`] = d._id;
      districtMap[d.name] = d._id;
    });

    const cropMap = {};
    cropTypes.forEach((c) => {
      cropMap[c.code] = c._id;
      cropMap[c.name.toUpperCase()] = c._id;
    });

    // Step 3: Transform data for MongoDB
    console.log("\nStep 3: Transforming data...");

    const productionRecords = [];
    let transformErrors = 0;

    validData.forEach((row, index) => {
      try {
        // Parse crop year
        const yearParts = row.year.split("-");
        const startYear = parseInt(yearParts[0]);
        const endYear = parseInt(`20${yearParts[1]}`);

        // Determine level
        let level = "national";
        if (
          row.province &&
          row.province !== "Pakistan" &&
          row.province !== "National"
        ) {
          level =
            row.district &&
            row.district !== "All Districts" &&
            row.district !== "Provincial Total"
              ? "district"
              : "provincial";
        }

        // Get province ID
        let provinceId = null;
        let provinceCode = null;
        if (
          row.province &&
          row.province !== "Pakistan" &&
          row.province !== "National"
        ) {
          provinceId = provinceMap[row.province];
          const province = provinces.find((p) => p._id.equals(provinceId));
          provinceCode = province?.code;
        }

        // Get district ID
        let districtId = null;
        let districtCode = null;
        if (level === "district" && row.district) {
          districtId =
            districtMap[row.district] ||
            districtMap[`${provinceCode}-${row.district}`];
          const district = districts.find((d) => d._id.equals(districtId));
          districtCode = district?.code;
        }

        // Get crop type ID
        const cropTypeId = cropMap["COTTON"];

        if (!cropTypeId) {
          console.warn(
            `  Warning: COTTON crop type not found, skipping row ${index + 1}`
          );
          transformErrors++;
          return;
        }

        // Determine if forecast (2025-26 or marked as forecast)
        const isForecast =
          row.year === "2025-26" ||
          row.dataSource?.includes("Forecast") ||
          row.district?.includes("Forecast");

        // Map data source to enum value
        const dataSourceText = row.dataSource || "CSV Import";
        let dataSourceEnum = "Other";
        let dataSourceDetails = dataSourceText;

        if (
          dataSourceText.includes("USDA FAS") ||
          dataSourceText.includes("USDA_FAS")
        ) {
          dataSourceEnum = "USDA_FAS";
        } else if (dataSourceText.includes("Economic Survey")) {
          dataSourceEnum = "Economic_Survey";
        } else if (dataSourceText.includes("PCGA")) {
          dataSourceEnum = "PCGA";
        } else if (dataSourceText.includes("PBS")) {
          dataSourceEnum = "PBS";
        } else if (dataSourceText.includes("MNFSR")) {
          dataSourceEnum = "MNFSR";
        } else if (
          dataSourceText.includes("Provincial") &&
          dataSourceText.includes("Dept")
        ) {
          dataSourceEnum = "Provincial_CRS";
        } else if (dataSourceText.includes("Estimated")) {
          dataSourceEnum = "Estimated";
        }

        const record = {
          year: row.year,
          cropYear: {
            startYear,
            endYear,
          },
          level,
          province: provinceId,
          provinceCode,
          district: districtId,
          districtCode,
          cropType: cropTypeId,
          cropCode: "COTTON",
          cropName: "Cotton",
          areaCultivated: {
            value: row.area,
            unit: "hectares",
          },
          production: {
            value: row.production,
            unit: "tonnes",
          },
          yield: {
            value: row.yield,
            unit: "tonnes_per_hectare",
          },
          dataSource: dataSourceEnum,
          dataSourceDetails: dataSourceDetails,
          isEstimated: dataSourceText.includes("Estimated") || false,
          isForecast,
          reliability:
            dataSourceEnum === "USDA_FAS" ||
            dataSourceEnum === "Economic_Survey"
              ? "high"
              : dataSourceEnum === "PCGA"
              ? "medium"
              : "medium",
          notes: row.year === "2022-23" ? "Flood-affected year" : undefined,
          tags: row.year === "2022-23" ? ["flood_affected"] : [],
        };

        productionRecords.push(record);
      } catch (error) {
        console.warn(
          `  Warning: Error transforming row ${index + 1}: ${error.message}`
        );
        transformErrors++;
      }
    });

    console.log(`  Transformed ${productionRecords.length} records`);
    if (transformErrors > 0) {
      console.log(
        `  ${transformErrors} rows skipped due to transformation errors`
      );
    }

    // Step 4: Clear existing cotton data (optional)
    console.log("\nStep 4: Clearing existing cotton data...");
    const deleteResult = await ProductionData.deleteMany({
      cropCode: "COTTON",
    });
    console.log(
      `  Deleted ${deleteResult.deletedCount} existing cotton records`
    );

    // Step 5: Bulk insert with error handling
    console.log("\nStep 5: Inserting into database...");

    if (productionRecords.length === 0) {
      throw new Error("No records to insert!");
    }

    console.log(
      `  Attempting to insert ${productionRecords.length} records...`
    );
    console.log(
      "  Sample record structure:",
      JSON.stringify(productionRecords[0], null, 2)
    );

    let insertResult;
    try {
      // Try inserting one record first to see specific error
      console.log("  Testing single record insert...");
      const testRecord = new ProductionData(productionRecords[0]);
      await testRecord.validate();
      console.log("  ✅ Validation passed for test record");

      const savedTest = await testRecord.save();
      console.log("  ✅ Test record saved successfully, ID:", savedTest._id);

      // Now try bulk insert of remaining records
      console.log("  Proceeding with bulk insert...");
      insertResult = await ProductionData.insertMany(
        productionRecords.slice(1),
        {
          ordered: false,
        }
      );

      console.log(
        `  ✅ Inserted ${
          insertResult.length + 1
        } cotton production records (including test)`
      );
      insertResult = [savedTest, ...insertResult];
    } catch (error) {
      console.error("  ❌ Insert error:", error.message);
      console.error("  Error name:", error.name);
      console.error("  Full error:", JSON.stringify(error, null, 2));

      if (error.errors) {
        console.error("  Validation errors:");
        Object.keys(error.errors).forEach((key) => {
          console.error(`    - ${key}: ${error.errors[key].message}`);
        });
      }

      if (error.writeErrors) {
        console.error(`  Found ${error.writeErrors.length} write errors`);
        console.error("  First 3 errors:");
        error.writeErrors.slice(0, 3).forEach((err, idx) => {
          console.error(
            `    Error ${idx + 1}:`,
            err.err.errmsg || err.err.message
          );
        });
      }

      if (error.insertedDocs) {
        console.log(
          `  Partial success: ${error.insertedDocs.length} records inserted`
        );
        insertResult = error.insertedDocs;
      } else {
        throw error;
      }
    }

    // Step 6: Verification
    console.log("\nStep 6: Verification...");
    const count = await ProductionData.countDocuments({ cropCode: "COTTON" });
    console.log(`  Total cotton records in database: ${count}`);

    // Summary by year
    const pipeline = [
      { $match: { cropCode: "COTTON" } },
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
          totalProduction: { $sum: "$production.value" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const yearSummary = await ProductionData.aggregate(pipeline);

    console.log("\n📊 Records by Year:");
    yearSummary.forEach((item) => {
      console.log(
        `  ${item._id}: ${item.count} records, ${(
          item.totalProduction / 1000000
        ).toFixed(2)}M tonnes`
      );
    });

    console.log("\n✅ COTTON IMPORT COMPLETED SUCCESSFULLY!");

    return {
      imported: insertResult?.length || 0,
      errors: importer.getErrors(),
      yearSummary,
    };
  } catch (error) {
    console.error(`❌ Error importing cotton data: ${error.message}`);
    throw error;
  }
};

export default importCotton;

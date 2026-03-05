import path from "path";
import CSVImporter from "./csvImporter.js";
import ProductionData from "../../models/productionData.model.js";
import Province from "../../models/province.model.js";
import District from "../../models/district.model.js";
import CropType from "../../models/cropType.model.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as AlertService from "../../services/alert.service.js";
import { checkYieldAnomaly } from "../../services/anomalyDetection.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const importRice = async () => {
  let ingestionLogId = null;
  try {
    console.log("🌾 Starting Rice Production Data Import...");

    // 1. Log Ingestion Start
    ingestionLogId = await AlertService.logIngestionStart("CSV Import", "Production Data (Rice)");

    const csvPath = path.join(
      __dirname,
      "../../data/Pakistan_Rice_Production_Data_2018-2025.csv"
    );
    console.log("Step 1: Parsing CSV file...");
    const importer = new CSVImporter(csvPath, "RICE");
    await importer.parseCSV();

    const validData = importer.getResults();

    if (validData.length === 0) {
      throw new Error("No valid data to import!");
    }

    console.log("\nStep 2: Loading reference data...");
    const provinces = await Province.find({});
    const districts = await District.find({});
    const cropTypes = await CropType.find({});

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

    // Fetch existing data for anomaly detection (previous year comparison)
    const previousData = await ProductionData.find({ cropCode: "RICE" }).lean();
    const anomalies = [];

    for (const [index, row] of validData.entries()) {
      try {
        // ... (Existing transformation logic)
        const yearParts = row.year.split("-");
        const startYear = parseInt(yearParts[0]);
        const endYear = parseInt(`20${yearParts[1]}`);

        let level = "national";
        if (row.province && row.province !== "Pakistan" && row.province !== "National") {
          level = row.district && row.district !== "All Districts" && row.district !== "Provincial Total" ? "district" : "provincial";
        }

        let provinceId = null;
        let provinceCode = null;
        if (row.province && row.province !== "Pakistan" && row.province !== "National") {
          provinceId = provinceMap[row.province];
          const province = provinces.find((p) => p._id.equals(provinceId));
          provinceCode = province?.code;
        }

        let districtId = null;
        let districtCode = null;
        if (level === "district" && row.district) {
          districtId = districtMap[row.district] || districtMap[`${provinceCode}-${row.district}`];
          const district = districts.find((d) => d._id.equals(districtId));
          districtCode = district?.code;
        }

        const cropTypeId = cropMap["RICE"];
        if (!cropTypeId) {
          transformErrors++;
          continue;
        }

        const isForecast = row.year === "2024-25" || false;
        const dataSourceText = row.dataSource || "CSV Import";
        let dataSourceEnum = "Other";

        if (dataSourceText.includes("USDA")) dataSourceEnum = "USDA_FAS";
        else if (dataSourceText.includes("Economic Survey")) dataSourceEnum = "Economic_Survey";
        else if (dataSourceText.includes("PBS")) dataSourceEnum = "PBS";
        else if (dataSourceText.includes("Provincial")) dataSourceEnum = "Provincial_CRS";

        const record = {
          year: row.year,
          cropYear: { startYear, endYear },
          level,
          province: provinceId,
          provinceCode,
          district: districtId,
          districtCode,
          cropType: cropTypeId,
          cropCode: "RICE",
          cropName: "Rice",
          areaCultivated: { value: row.area, unit: "hectares" },
          production: { value: row.production, unit: "tonnes" },
          yield: { value: row.yield, unit: "tonnes_per_hectare" },
          dataSource: dataSourceEnum,
          dataSourceDetails: dataSourceText,
          isEstimated: dataSourceText.includes("Estimated") || false,
          isForecast: isForecast,
          reliability: "medium",
        };

        productionRecords.push(record);

        // Anomaly Detection Logic
        // Find previous year record for comparison
        const prevYear = `${startYear - 1}-${endYear - 1}`.slice(2); // approximate check
        // Better: just look for previous year string match from DB
        // Since this is a bulk import, checking against DB might be slow if we query every time.
        // But we fetched `previousData` above.

        // Let's rely on `year` string format "2023-24" -> prev "2022-23"
        const prevYearStr = `${startYear - 1}-${(endYear - 1).toString().slice(-2)}`;

        const prevRecord = previousData.find(p =>
          p.year === prevYearStr &&
          p.level === level &&
          String(p.province) === String(provinceId) &&
          String(p.district) === String(districtId)
        );

        if (prevRecord) {
          const anomaly = checkYieldAnomaly(record, prevRecord);
          if (anomaly) {
            anomalies.push({
              crop: "Rice",
              region: row.district || row.province || "Pakistan",
              year: row.year,
              data: anomaly
            });
          }
        }

      } catch (error) {
        console.warn(`  Warning: Error transforming row ${index + 1}: ${error.message}`);
        transformErrors++;
      }
    }

    console.log("\nStep 4: Clearing existing rice data...");
    await ProductionData.deleteMany({ cropCode: "RICE" });

    console.log("\nStep 5: Inserting into database...");
    const insertResult = await ProductionData.insertMany(productionRecords, { ordered: false });
    console.log(`  ✅ Inserted ${insertResult.length} rice production records`);

    // 2. Generate Alerts for Anomalies
    if (anomalies.length > 0) {
      console.log(`\n⚠️ Detected ${anomalies.length} production anomalies. Generating alerts...`);
      for (const item of anomalies) {
        await AlertService.createProductionAlert(item.crop, item.region, item.year, item.data);
      }
    }

    // 3. Log Ingestion Success
    await AlertService.logIngestionEnd(ingestionLogId, "completed", insertResult.length);

    return {
      imported: insertResult.length,
      errors: importer.getErrors(),
    };

  } catch (error) {
    console.error(`❌ Error during rice import: ${error.message}`);

    // 4. Log Ingestion Failure & Create System Alert
    if (ingestionLogId) {
      await AlertService.logIngestionEnd(ingestionLogId, "failed", 0, error);
      await AlertService.createSystemAlert(
        "Rice Data Import Failed",
        `Automated import failed: ${error.message}`,
        "high"
      );
    }
    throw error;
  }
};

export default importRice;

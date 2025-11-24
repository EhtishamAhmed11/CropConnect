import importRice from "./importRice.js";
import importCotton from "./importCotton.js";
import importWheat from "./importWheat.js";

/**
 * MASTER IMPORT RUNNER
 * Purpose: Import all 3 crops in one command
 */
const importAllCrops = async () => {
  try {
    console.log("🚀 Starting Complete Crop Data Import Process...");
    console.log("═".repeat(60));
    console.log("");

    const startTime = Date.now();
    const results = {};

    // Import Rice
    console.log("🌾 STEP 1/3: Importing Rice Data");
    console.log("─".repeat(60));
    results.rice = await importRice();
    console.log("");

    // Import Cotton
    console.log("🌱 STEP 2/3: Importing Cotton Data");
    console.log("─".repeat(60));
    results.cotton = await importCotton();
    console.log("");

    // Import Wheat
    console.log("🌾 STEP 3/3: Importing Wheat Data");
    console.log("─".repeat(60));
    results.wheat = await importWheat();
    console.log("");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Final Summary
    console.log("═".repeat(60));
    console.log("✅ ALL CROPS IMPORTED SUCCESSFULLY!");
    console.log("═".repeat(60));
    console.log("");
    console.log("📊 IMPORT SUMMARY:");
    console.log(`  Rice:   ${results.rice.imported} records`);
    console.log(`  Cotton: ${results.cotton.imported} records`);
    console.log(`  Wheat:  ${results.wheat.imported} records`);
    console.log(
      `  TOTAL:  ${
        results.rice.imported + results.cotton.imported + results.wheat.imported
      } records`
    );
    console.log("");
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log("═".repeat(60));

    return results;
  } catch (error) {
    console.error("❌ IMPORT PROCESS FAILED!");
    console.error(error);
    throw error;
  }
};

export default importAllCrops;

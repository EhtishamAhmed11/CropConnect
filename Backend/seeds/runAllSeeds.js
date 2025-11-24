import seedCropTypes from "./03-cropTypes.seed.js";
import seedDistricts from "./02-districts.seed.js";
import seedProvinces from "./01-provinces.seed.js";

const runAllSeeds = async () => {
  try {
    console.log("🚀 Starting Complete Database Seeding Process...");
    console.log("");

    const startTime = Date.now();

    console.log("📍 STEP 1/3: Seeding Provinces");
    console.log("─".repeat(50));
    await seedProvinces();
    console.log("");

    console.log("🗺️  STEP 2/3: Seeding Districts");
    console.log("─".repeat(50));
    await seedDistricts();
    console.log("");

    console.log("🌾 STEP 3/3: Seeding Crop Types");
    console.log("─".repeat(50));
    await seedCropTypes();
    console.log("");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("═".repeat(50));
    console.log("✅ ALL SEEDS COMPLETED SUCCESSFULLY!");
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log("═".repeat(50));
  } catch (error) {}
};

export default runAllSeeds
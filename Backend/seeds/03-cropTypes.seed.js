import mongoose from "mongoose";

import CropType from "../models/cropType.model.js";

const cropTypes = [
  {
    code: "RICE",
    name: "Rice",
    category: "grain",
    season: "kharif", // Planted April-May, harvested Oct-Nov
    avgConsumptionPerCapita: 24, // kg per person per year (Pakistan average)
    description:
      "Rice is a staple food crop grown primarily in Punjab and Sindh. Pakistan produces both Basmati (aromatic, premium) and non-Basmati varieties.",
    isActive: true,
  },
  {
    code: "COTTON",
    name: "Cotton",
    category: "cash_crop",
    season: "kharif", // Planted April-June, harvested Oct-Dec
    avgConsumptionPerCapita: 5, // kg per person per year (textile industry consumption)
    description:
      "Cotton is Pakistan's major cash crop and primary raw material for the textile industry. Main growing areas are Punjab and Sindh.",
    isActive: true,
  },
  {
    code: "WHEAT",
    name: "Wheat",
    category: "grain",
    season: "rabi", // Planted Oct-Dec, harvested April-May
    avgConsumptionPerCapita: 124, // kg per person per year (major staple food)
    description:
      "Wheat is Pakistan's most important staple food crop, grown across all provinces during the winter season.",
    isActive: true,
  },
];

const seedCropTypes = async () => {
  try {
    console.log("🌱 Starting Crop Types Seeding...");
    await CropType.deleteMany({});
    console.log("Cleared existing crop types");

    const insertedCrops = await CropType.insertMany(cropTypes);
    console.log(`Inserted ${insertedCrops.length} crop types.`);
    console.log(`Successfully seeded ${insertedCrops.length} crop types.`);

    console.log("\n📊 Crop Types Summary:");
    insertedCrops.forEach((crop) => {
      console.log(`  - ${crop.name} (${crop.code})`);
      console.log(`    Category: ${crop.category}`);
      console.log(`    Season: ${crop.season}`);
      console.log(
        `    Avg Consumption: ${crop.avgConsumptionPerCapita} kg/person/year`
          
      );
    });

    return insertedCrops;
  } catch (error) {
    console.error("Error seeding crop types:", error);
    throw error;
  }
};
export default seedCropTypes;

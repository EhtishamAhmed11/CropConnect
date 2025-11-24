import mongoose from "mongoose";
import Province from "../models/province.model.js";

const provinces = [
  {
    code: "PB",
    name: "Punjab",
    population: 110000000,
    area: 205344,
    coordinates: {
      latitude: 31.1704,
      longitude: 72.7097,
    },
    // GeoJSON geometry - simplified for demo
    // In production, use actual province boundaries
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [69.3451, 32.4279],
          [75.5748, 32.4279],
          [75.5748, 28.0],
          [69.3451, 28.0],
          [69.3451, 32.4279],
        ],
      ],
    },
    isActive: true,
  },
  {
    code: "SD",
    name: "Sindh",
    population: 47900000,
    area: 140914,
    coordinates: {
      latitude: 25.8943,
      longitude: 68.5247,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [66.0, 28.0],
          [71.0, 28.0],
          [71.0, 23.5],
          [66.0, 23.5],
          [66.0, 28.0],
        ],
      ],
    },
    isActive: true,
  },
  {
    code: "KP",
    name: "Khyber Pakhtunkhwa",
    population: 30500000,
    area: 74521,
    coordinates: {
      latitude: 34.9526,
      longitude: 72.3311,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [69.0, 36.0],
          [74.0, 36.0],
          [74.0, 31.5],
          [69.0, 31.5],
          [69.0, 36.0],
        ],
      ],
    },
    isActive: true,
  },
  {
    code: "BL",
    name: "Balochistan",
    population: 12300000,
    area: 347190,
    coordinates: {
      latitude: 28.4897,
      longitude: 65.0956,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [61.0, 31.0],
          [70.0, 31.0],
          [70.0, 24.5],
          [61.0, 24.5],
          [61.0, 31.0],
        ],
      ],
    },
    isActive: true,
  },
];

const seedProvinces = async () => {
  try {
    console.log("🌱 Starting Province Seeding...");
    await Province.deleteMany({}); //clear existing
    console.log("Cleared existing provinces".yellow);

    // Insert provinces
    const insertedProvinces = await Province.insertMany(provinces);

    console.log(
      `✅ Successfully seeded ${insertedProvinces.length} provinces`
    );

    // Display summary
    insertedProvinces.forEach((province) => {
      console.log(
        `  - ${province.name} (${
          province.code
        }): ${province.population.toLocaleString()} people`
      );
    });

    return insertedProvinces;
  } catch (error) {
    console.error(`❌ Error seeding provinces: ${error.message}`);
    throw error;
  }
};
export default seedProvinces;

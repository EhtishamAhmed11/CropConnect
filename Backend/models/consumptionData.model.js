import mongoose, { mongo } from "mongoose";

const ConsumptionDataSchema = new mongoose.Schema(
  {
    // Temporal Information
    year: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },

    // Geographic Information
    level: {
      type: String,
      enum: ["national", "provincial", "district"],
      required: true,
    },
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Province",
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },

    // Crop Information
    cropType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropType",
      required: true,
    },
    cropCode: String,

    // Consumption Metrics
    totalConsumption: {
      value: Number,
      unit: {
        type: String,
        default: "tonnes",
      },
    },

    perCapitaConsumption: {
      value: Number,
      unit: {
        type: String,
        default: "kg_per_year",
      },
    },

    population: {
      type: Number,
      required: true,
    },

    // Calculation Method
    calculationMethod: {
      type: String,
      enum: [
        "survey_based",
        "population_estimate",
        "historical_average",
        "statistical_model",
      ],
      default: "population_estimate",
    },

    isEstimated: {
      type: Boolean,
      default: true,
    },

    notes: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
ConsumptionDataSchema.index({ year: 1, cropCode: 1, level: 1 });
ConsumptionDataSchema.index({ province: 1, year: 1 });
const ConsumptionData = mongoose.model(
  "ConsumptionData",
  ConsumptionDataSchema
);

export default ConsumptionData;

import mongoose from "mongoose";

const ProductionDataSchema = new mongoose.Schema(
  {
    year: {
      type: String, // Format: "2024-25"
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    cropYear: {
      startYear: Number, // 2024
      endYear: Number, // 2025
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
    provinceCode: String,
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },
    districtCode: String,

    // Crop Information
    cropType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropType",
      required: true,
    },
    cropCode: {
      type: String,
      required: true,
    },
    cropName: {
      type: String,
      required: true,
    },

    // Production Metrics
    areaCultivated: {
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        default: "hectares",
      },
    },

    production: {
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        default: "tonnes",
      },
    },

    yield: {
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        default: "tonnes_per_hectare",
      },
    },

    // Data Quality & Source
    dataSource: {
      type: String,
      required: true,
      enum: [
        "PBS",
        "MNFSR",
        "USDA_FAS",
        "Economic_Survey",
        "Provincial_CRS",
        "PCGA",
        "Estimated",
        "Other",
      ],
    },
    dataSourceDetails: String,

    isEstimated: {
      type: Boolean,
      default: false,
    },
    isForecast: {
      type: Boolean,
      default: false,
    },

    reliability: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "high",
    },

    // Special Events/Notes
    notes: String,
    tags: [String], // e.g., 'flood_affected', 'drought', 'record_production'

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
ProductionDataSchema.index({ year: 1, cropCode: 1, level: 1 });
ProductionDataSchema.index({ year: 1, provinceCode: 1, cropCode: 1 });
ProductionDataSchema.index({ year: 1, districtCode: 1, cropCode: 1 });
ProductionDataSchema.index({ cropType: 1, year: 1 });
ProductionDataSchema.index({ province: 1, year: 1 });
ProductionDataSchema.index({ district: 1, year: 1 });
const ProductionData = mongoose.model("ProductionData", ProductionDataSchema);
export default ProductionData;

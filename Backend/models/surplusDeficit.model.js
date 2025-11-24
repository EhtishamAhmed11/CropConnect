import mongoose from "mongoose";

const SurplusDeficitSchema = new mongoose.Schema({
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
  cropCode: String,

  // Analysis Data
  production: {
    type: Number,
    required: true,
  },
  consumption: {
    type: Number,
    required: true,
  },

  balance: {
    type: Number,
    required: true,
  }, // production - consumption

  status: {
    type: String,
    enum: ["surplus", "deficit", "balanced"],
    required: true,
  },

  // Percentage calculations
  surplusDeficitPercentage: Number, // (balance / consumption) * 100
  selfSufficiencyRatio: Number, // (production / consumption) * 100

  // Severity Classification
  severity: {
    type: String,
    enum: ["critical", "moderate", "mild", "none"],
    default: "none",
  },

  // Alert Status
  requiresIntervention: {
    type: Boolean,
    default: false,
  },

  priorityLevel: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "low",
  },

  // Recommendations
  recommendations: [String],

  // Calculation metadata
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  notes: String,
});
SurplusDeficitSchema.index({ year: 1, cropCode: 1, level: 1 });
SurplusDeficitSchema.index({ status: 1, severity: 1 });
SurplusDeficitSchema.index({ requiresIntervention: 1 });
SurplusDeficitSchema.index({ province: 1, year: 1 });

const SurplusDeficit = mongoose.model("SurplusDeficit", SurplusDeficitSchema);
export default SurplusDeficit;


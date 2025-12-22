import mongoose from "mongoose";

const CropTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["grain", "cash_crop", "vegetable", "fruit", "other"],
    required: true,
  },
  season: {
    type: String,
    enum: ["kharif", "rabi", "both"],
    required: true,
  },

  // Consumption estimates
  avgConsumptionPerCapita: {
    type: Number, // kg per person per year
    required: true,
  },

  // Metadata
  description: String,
  imageUrl: String,
  isActive: {
    type: Boolean,
    default: true,
  },
});

CropTypeSchema.index({ category: 1 });

const CropType = mongoose.model("CropType", CropTypeSchema);
export default CropType;

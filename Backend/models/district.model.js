import mongoose from "mongoose";

const DistrictSchema = new mongoose.Schema(
  {
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
      trim: true,
    },
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Province",
      required: true,
    },
    provinceCode: {
      type: String,
      required: true,
    },

    population: Number,
    area: Number, // in square kilometers

    // Geographic Coordinates
    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    // GeoJSON for map rendering
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        default: "Polygon",
      },
      coordinates: mongoose.Schema.Types.Mixed, // Use Mixed to handle both Polygon and MultiPolygon
    },

    // Agricultural classification
    agriculturalZone: {
      type: String,
      enum: [
        "high_productivity",
        "medium_productivity",
        "low_productivity",
        "marginal",
      ],
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
DistrictSchema.index({ province: 1 });
DistrictSchema.index({ provinceCode: 1 });
DistrictSchema.index({ name: 1, provinceCode: 1 });
const District = mongoose.model("District", DistrictSchema);

export default District;

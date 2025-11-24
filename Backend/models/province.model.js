import mongoose from "mongoose";

const provinceSchema = new mongoose.Schema(
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
      unique: true,
      trim: true,
    },
    population: {
      type: Number,
      required: true,
    },
    area: {
      type: Number, // in square kilometers
      required: true,
    },

    // Geographic Coordinates for mapping
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
      coordinates: [[[Number]]], // Array of coordinate arrays
    },

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

provinceSchema.index({ code: 1 });
const Province = mongoose.model("Province", provinceSchema);

export default Province;

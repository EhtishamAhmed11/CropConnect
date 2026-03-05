import mongoose from "mongoose";

const YieldPredictionSchema = new mongoose.Schema(
    {
        // Crop and Region Information
        crop: {
            type: String,
            required: true,
            enum: ["Wheat", "Rice", "Cotton"],
        },
        cropType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CropType",
        },
        region: {
            type: String,
            required: true,
            enum: ["Punjab", "Sindh", "KPK", "Balochistan", "Pakistan"],
        },
        province: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Province",
        },

        // Prediction Data
        year: {
            type: Number,
            required: true,
        },
        predictedProduction: {
            value: {
                type: Number,
                required: true,
                min: 0,
            },
            unit: {
                type: String,
                default: "thousand tonnes",
            },
        },

        // Model Information
        modelType: {
            type: String,
            required: true,
        },
        modelR2: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },

        // Metadata
        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
YieldPredictionSchema.index({ crop: 1, region: 1, year: 1 });
YieldPredictionSchema.index({ year: 1 });
YieldPredictionSchema.index({ crop: 1, year: 1 });

const YieldPrediction = mongoose.model("YieldPrediction", YieldPredictionSchema);
export default YieldPrediction;

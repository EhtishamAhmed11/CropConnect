import mongoose from "mongoose";

const ModelPerformanceSchema = new mongoose.Schema(
    {
        crop: {
            type: String,
            required: true,
            enum: ["Wheat", "Rice", "Cotton"],
        },
        region: {
            type: String,
            required: true,
            enum: ["Punjab", "Sindh", "KPK", "Balochistan", "Pakistan"],
        },

        // Model Details
        bestModel: {
            type: String,
            required: true,
        },

        // Performance Metrics
        testR2: {
            type: Number,
            required: true,
        },
        cvR2: {
            type: Number,
            required: true,
        },
        testRMSE: {
            type: Number,
            required: true,
        },
        testMAE: {
            type: Number,
            required: true,
        },
        mape: {
            type: Number,
            required: true,
        },

        // Metadata
        trainedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Indexes
ModelPerformanceSchema.index({ crop: 1, region: 1 }, { unique: true });

const ModelPerformance = mongoose.model("ModelPerformance", ModelPerformanceSchema);
export default ModelPerformance;

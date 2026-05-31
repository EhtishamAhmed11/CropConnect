import mongoose from "mongoose";

const ActualVsPredictedSchema = new mongoose.Schema(
    {
        crop: {
            type: String,
            required: true,
            enum: ["Wheat", "Rice", "Cotton"],
        },
        region: {
            type: String,
            required: true,
            enum: ["Punjab", "Sindh", "KPK", "Balochistan"],
        },
        year: {
            type: Number,
            required: true,
        },
        actualProduction: {
            type: Number,
            required: true,
        },
        predictedProduction: {
            type: Number,
            required: true,
        },
        errorKt: {
            type: Number,
            default: 0,
        },
        errorPct: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

ActualVsPredictedSchema.index({ crop: 1, region: 1, year: 1 });
ActualVsPredictedSchema.index({ crop: 1, region: 1 });

const ActualVsPredicted = mongoose.model("ActualVsPredicted", ActualVsPredictedSchema);
export default ActualVsPredicted;

import mongoose from "mongoose";

/**
 * Stores the output of the market forecast engine.
 * One document per crop × district × forecastDate.
 * Re-generated daily by the scheduler.
 */
const marketForecastSchema = new mongoose.Schema(
    {
        cropType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CropType",
            required: true,
        },
        district: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "District",
            required: true,
        },

        // The base price used for this forecast (7-day moving average)
        basePrice: { type: Number, required: true },

        // 30-day forecast broken into three 10-day windows
        forecast: {
            day10: {
                price:          { type: Number },
                confidenceLow:  { type: Number },
                confidenceHigh: { type: Number },
            },
            day20: {
                price:          { type: Number },
                confidenceLow:  { type: Number },
                confidenceHigh: { type: Number },
            },
            day30: {
                price:          { type: Number },
                confidenceLow:  { type: Number },
                confidenceHigh: { type: Number },
            },
        },

        // The factors that shaped this forecast — shown to the user as explanation
        factors: {
            seasonal: {
                label:       { type: String }, // e.g. "Pre-harvest pressure"
                multiplier:  { type: Number },
                impact:      { type: String, enum: ["positive", "negative", "neutral"] },
            },
            weather: {
                label:       { type: String }, // e.g. "Heat stress in Punjab"
                multiplier:  { type: Number },
                impact:      { type: String, enum: ["positive", "negative", "neutral"] },
            },
            supply: {
                label:       { type: String }, // e.g. "Region in critical deficit"
                multiplier:  { type: Number },
                impact:      { type: String, enum: ["positive", "negative", "neutral"] },
            },
        },

        // Plain-English summary for the UI
        summary: { type: String },

        // Overall direction
        trend: {
            type: String,
            enum: ["rising", "falling", "stable"],
        },

        // When this forecast was computed
        generatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// One forecast per crop+district per day
marketForecastSchema.index({ cropType: 1, district: 1, generatedAt: -1 });

const MarketForecast = mongoose.model("MarketForecast", marketForecastSchema);
export default MarketForecast;

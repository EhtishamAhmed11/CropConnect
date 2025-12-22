// backend/models/tollRate.model.js
import mongoose from "mongoose";

const TollRateSchema = new mongoose.Schema({
    // Route identification
    routeId: {
        type: String,
        unique: true,
        required: true,
    },
    routeName: {
        type: String,
        required: true,
    },

    // Highway type
    highwayType: {
        type: String,
        enum: ["national", "motorway"],
        required: true,
    },

    // Route segment (e.g., "Islamabad-Peshawar", "Lahore-Abdul Hakeem")
    routeSegment: {
        type: String,
        required: true,
    },

    // Toll rates by vehicle category (in PKR)
    rates: {
        car: { type: Number, default: 0 },
        wagon: { type: Number, default: 0 },
        wagonUpto12Seater: { type: Number, default: 0 },
        coasterMiniBus: { type: Number, default: 0 },
        bus: { type: Number, default: 0 },
        twoThreeAxleTruck: { type: Number, default: 0 },
        articulatedTruck: { type: Number, default: 0 },
    },

    // Optional toll plaza name
    tollPlaza: String,

    // Active status
    isActive: {
        type: Boolean,
        default: true,
    },

    // Last updated
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes

TollRateSchema.index({ highwayType: 1 });
TollRateSchema.index({ routeSegment: 1 });

const TollRate = mongoose.model("TollRate", TollRateSchema);

export default TollRate;

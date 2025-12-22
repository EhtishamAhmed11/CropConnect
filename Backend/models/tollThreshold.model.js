// backend/models/tollThreshold.model.js
import mongoose from "mongoose";

const TollThresholdSchema = new mongoose.Schema({
    thresholdId: {
        type: String,
        unique: true,
        required: true,
    },

    // Route identification
    tollRoute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TollRate",
    },

    // Vehicle type to monitor
    vehicleType: {
        type: String,
        enum: [
            "car",
            "wagon",
            "wagonUpto12Seater",
            "coasterMiniBus",
            "bus",
            "twoThreeAxleTruck",
            "articulatedTruck",
        ],
        required: true,
    },

    // Threshold value (alert when toll exceeds this)
    maxTollAmount: {
        type: Number,
        required: true,
    },

    // Alert settings
    alertSeverity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
    },
    cooldownHours: {
        type: Number,
        default: 24, // Toll rates change less frequently
    },

    // Scope
    isGlobal: {
        type: Boolean,
        default: false,
    },

    // User who created
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
    },

    // Tracking
    lastTriggered: Date,
    triggerCount: {
        type: Number,
        default: 0,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes

TollThresholdSchema.index({ createdBy: 1 });
TollThresholdSchema.index({ isActive: 1 });

const TollThreshold = mongoose.model("TollThreshold", TollThresholdSchema);

export default TollThreshold;

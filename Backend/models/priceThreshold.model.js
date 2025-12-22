// backend/models/priceThreshold.model.js
import mongoose from "mongoose";

const PriceThresholdSchema = new mongoose.Schema({
    thresholdId: {
        type: String,
        unique: true,
        required: true,
    },

    // Target crop and location
    cropType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CropType",
        required: true,
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
    },

    // Threshold configuration
    thresholdType: {
        type: String,
        enum: ["above", "below", "both"],
        required: true,
    },
    upperLimit: {
        type: Number, // Alert when price > this
    },
    lowerLimit: {
        type: Number, // Alert when price < this
    },
    percentageChange: {
        type: Number, // Alert on % change from baseline
    },

    // Alert settings
    alertSeverity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
    },
    cooldownHours: {
        type: Number,
        default: 4, // Minimum hours between alerts
    },

    // Scope: personal or global
    isGlobal: {
        type: Boolean,
        default: false, // If true, visible to all users
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

    // Timestamps
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

PriceThresholdSchema.index({ cropType: 1, district: 1 });
PriceThresholdSchema.index({ createdBy: 1 });
PriceThresholdSchema.index({ isActive: 1 });
PriceThresholdSchema.index({ isGlobal: 1 });

// Pre-save middleware to update timestamp
PriceThresholdSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const PriceThreshold = mongoose.model("PriceThreshold", PriceThresholdSchema);

export default PriceThreshold;

import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true,
  },

  // Alert Details
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },

  alertType: {
    type: String,
    enum: [
      "production_drop",
      "deficit_critical",
      "data_ingestion_failure",
      "system_health",
      "threshold_breach",
      "custom",
    ],
    required: true,
  },

  severity: {
    type: String,
    enum: ["critical", "high", "medium", "low", "info"],
    default: "medium",
  },

  // Related Data
  relatedEntity: {
    entityType: {
      type: String,
      enum: ["production", "surplus_deficit", "system", "user"],
    },
    entityId: mongoose.Schema.Types.ObjectId,
  },

  // Geographic Context
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Province",
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "District",
  },
  cropType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CropType",
  },

  // Alert Data
  metadata: mongoose.Schema.Types.Mixed, // Flexible data storage

  // Targeting
  targetRoles: [
    {
      type: String,
      enum: [
        "admin",
        "government_policy_maker",
        "ngo_coordinator",
        "distributor",
        "all",
      ],
    },
  ],

  targetUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // Status & Actions
  status: {
    type: String,
    enum: ["active", "acknowledged", "resolved", "expired"],
    default: "active",
  },

  acknowledgedBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acknowledgedAt: Date,
    },
  ],

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: Date,
  resolutionNotes: String,

  // Delivery Status
  deliveryChannels: {
    inApp: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },

  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: Date,

  // Auto-expiry
  expiresAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
AlertSchema.index({ alertId: 1 });
AlertSchema.index({ alertType: 1, severity: 1 });
AlertSchema.index({ status: 1 });
AlertSchema.index({ targetRoles: 1 });
AlertSchema.index({ createdAt: -1 });


const Alert = mongoose.model("Alert", AlertSchema);

export default Alert
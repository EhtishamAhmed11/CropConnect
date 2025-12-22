import mongoose from "mongoose";

const DataIngestionLogSchema = new mongoose.Schema({
  ingestionId: {
    type: String,
    unique: true,
    required: true,
  },

  sourceType: {
    type: String,
    enum: [
      "PBS",
      "MNFSR",
      "USDA_FAS",
      "Provincial_CRS",
      "CSV_Upload",
      "API",
      "Manual_Entry",
    ],
    required: true,
  },

  dataType: {
    type: String,
    enum: ["production", "consumption", "geographic", "other"],
    required: true,
  },

  // File Information (if applicable)
  fileName: String,
  fileSize: Number,
  fileUrl: String,

  // Processing Status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "partial"],
    default: "pending",
  },

  // Processing Results
  recordsProcessed: {
    type: Number,
    default: 0,
  },
  recordsInserted: {
    type: Number,
    default: 0,
  },
  recordsUpdated: {
    type: Number,
    default: 0,
  },
  recordsFailed: {
    type: Number,
    default: 0,
  },

  // Error Tracking
  errors: [
    {
      row: Number,
      field: String,
      errorMessage: String,
      timestamp: Date,
    },
  ],

  // Validation
  validationPassed: {
    type: Boolean,
    default: true,
  },
  validationErrors: [String],

  // User Information
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Timing
  startedAt: Date,
  completedAt: Date,
  processingTime: Number, // in seconds

  // Retry Information
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },

  // Metadata
  notes: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


DataIngestionLogSchema.index({ status: 1 });
DataIngestionLogSchema.index({ sourceType: 1 });
DataIngestionLogSchema.index({ createdAt: -1 });

const DataIngestionLog = mongoose.model(
  "DataIngestionLog",
  DataIngestionLogSchema
);
export default DataIngestionLog;

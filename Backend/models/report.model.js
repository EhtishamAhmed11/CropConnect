import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true,
  },

  // Report Details
  title: {
    type: String,
    required: true,
  },
  description: String,

  reportType: {
    type: String,
    enum: [
      "production_analysis",
      "regional_comparison",
      "surplus_deficit",
      "trend_analysis",
      "district_performance",
      "custom",
    ],
    required: true,
  },

  // Report Parameters
  parameters: {
    year: [String], // Can be multiple years
    crops: [String],
    provinces: [String],
    districts: [String],
    dateFrom: Date,
    dateTo: Date,
    customFilters: mongoose.Schema.Types.Mixed,
  },

  // Generated File Information
  format: {
    type: String,
    enum: ["pdf", "csv", "excel", "json"],
    required: true,
  },

  fileUrl: String,
  fileName: String,
  fileSize: Number, // in bytes

  // Generation Status
  status: {
    type: String,
    enum: ["pending", "generating", "completed", "failed"],
    default: "pending",
  },

  // User Information
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Scheduling
  isScheduled: {
    type: Boolean,
    default: false,
  },
  scheduleFrequency: {
    type: String,
    enum: ["daily", "weekly", "monthly", "none"],
    default: "none",
  },
  nextScheduledRun: Date,

  // Email Recipients
  emailRecipients: [String],
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: Date,

  // Metadata
  generatedAt: Date,
  expiresAt: Date, // Auto-delete old reports

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
ReportSchema.index({ reportId: 1 });
ReportSchema.index({ generatedBy: 1 });
ReportSchema.index({ reportType: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ isScheduled: 1, nextScheduledRun: 1 });

const Report = mongoose.model("Report", ReportSchema);

export default Report;

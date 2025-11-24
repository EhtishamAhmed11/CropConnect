import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: String,
  userRole: String,

  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      "login",
      "logout",
      "create",
      "read",
      "update",
      "delete",
      "export",
      "generate_report",
      "acknowledge_alert",
      "change_password",
      "update_profile",
      "data_upload",
      "other",
    ],
  },

  resource: {
    type: String,
    required: true, // e.g., 'ProductionData', 'Report', 'User'
  },

  resourceId: Schema.Types.ObjectId,

  // Request Information
  method: String, // GET, POST, PUT, DELETE
  endpoint: String,
  ipAddress: String,
  userAgent: String,

  // Change Tracking
  changesBefore: Schema.Types.Mixed,
  changesAfter: Schema.Types.Mixed,

  // Status
  status: {
    type: String,
    enum: ["success", "failure"],
    default: "success",
  },
  errorMessage: String,

  // Metadata
  metadata: Schema.Types.Mixed,

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;

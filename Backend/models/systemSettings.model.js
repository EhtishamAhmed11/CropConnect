import mongoose from "mongoose";

const SystemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true,
  },
  value: mongoose.Schema.Types.Mixed,
  category: {
    type: String,
    enum: ["general", "alerts", "reports", "notifications", "security", "data"],
    default: "general",
  },
  description: String,
  isEditable: {
    type: Boolean,
    default: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  lastModifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
SystemSettingSchema.index({ key: 1 });
SystemSettingSchema.index({ category: 1 });

const SystemSetting = mongoose.model("SystemSetting", SystemSettingSchema);
export default SystemSetting;

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // Basic Information
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    // Profile Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: /^[0-9]{10,15}$/,
    },

    // Role-Based Access Control
    role: {
      type: String,
      enum: [
        "admin",
        "government_policy_maker",
        "ngo_coordinator",
        "distributor",
      ],
      required: true,
      default: "government_policy_maker",
    },

    // Organization Details
    organization: {
      name: String,
      type: {
        type: String,
        enum: ["government", "ngo", "logistics", "other"],
      },
      department: String,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpiry: Date,

    // Security
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
      reportFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "none"],
        default: "weekly",
      },
      defaultProvince: String,
      defaultCrop: String,
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
  },
  { timestamps: true }
);
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
const User = mongoose.model("User", UserSchema);
export default User;

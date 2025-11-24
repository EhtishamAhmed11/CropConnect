// backend/controllers/user.controller.js
import User from "../models/user.model.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();

    return ApiResponse.success(
      res,
      user,
      "User profile retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, organization, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (organization)
      user.organization = { ...user.organization, ...organization };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.success(
      res,
      userResponse,
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(
        res,
        "Current password and new password are required",
        400
      );
    }

    if (newPassword.length < 8) {
      return ApiResponse.error(
        res,
        "New password must be at least 8 characters long",
        400
      );
    }

    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, "Current password is incorrect", 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return ApiResponse.success(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return ApiResponse.error(res, "Preferences object is required", 400);
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    return ApiResponse.success(
      res,
      { preferences: user.preferences },
      "Preferences updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user activity log
 * @route   GET /api/users/activity
 * @access  Private
 */
export const getUserActivity = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, dateFrom, dateTo } = req.query;

    // This would typically query an AuditLog model
    // For now, returning a placeholder
    const AuditLog = require("../models/auditLog.model");

    const query = { user: req.user._id };
    if (action) query.action = action;
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      activities,
      page,
      limit,
      total,
      "User activity retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private
 */
export const getUserStats = async (req, res, next) => {
  try {
    const Report = require("../models/report.model");
    const Alert = require("../models/alert.model");

    // Get user's reports count
    const reportsGenerated = await Report.countDocuments({
      generatedBy: req.user._id,
    });

    // Get user's acknowledged alerts count
    const alertsAcknowledged = await Alert.countDocuments({
      "acknowledgedBy.user": req.user._id,
    });

    // Get last login
    const lastLogin = req.user.lastLogin;

    // Account age
    const accountAge = Math.floor(
      (Date.now() - new Date(req.user.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return ApiResponse.success(
      res,
      {
        reportsGenerated,
        alertsAcknowledged,
        lastLogin,
        accountAgeDays: accountAge,
        memberSince: req.user.createdAt,
      },
      "User statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate user account (soft delete)
 * @route   DELETE /api/users/account
 * @access  Private
 */
export const deactivateAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return ApiResponse.error(res, "Password confirmation required", 400);
    }

    const user = await User.findById(req.user._id);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, "Password is incorrect", 401);
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    return ApiResponse.success(res, null, "Account deactivated successfully");
  } catch (error) {
    next(error);
  }
};

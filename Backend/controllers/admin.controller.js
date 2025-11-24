// backend/controllers/admin.controller.js
import User from "../models/user.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import Report from "../models/report.model.js";
import Alert from "../models/alerts.model.js";
import DataIngestionLog from "../models/dataIngestionLog.model.js";
import SystemSettings from "../models/systemSettings.model.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      isActive,
      isVerified,
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isVerified !== undefined) query.isVerified = isVerified === "true";

    // Search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      users,
      page,
      limit,
      total,
      "Users retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    return ApiResponse.success(res, user, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createUser = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      role,
      organization,
    } = req.body;

    // Validation
    if (!username || !email || !password || !fullName || !role) {
      return ApiResponse.error(
        res,
        "Username, email, password, full name, and role are required",
        400
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return ApiResponse.error(
        res,
        "User with this email or username already exists",
        400
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role,
      organization,
      isVerified: true, // Admin-created users are auto-verified
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.created(res, userResponse, "User created successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, role, organization, isActive, isVerified } =
      req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;
    if (organization)
      user.organization = { ...user.organization, ...organization };
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.success(res, userResponse, "User updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    return ApiResponse.success(res, null, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProduction,
      totalReports,
      activeAlerts,
      criticalAlerts,
      recentIngestions,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      ProductionData.countDocuments({}),
      Report.countDocuments({}),
      Alert.countDocuments({ status: "active" }),
      Alert.countDocuments({ status: "active", severity: "critical" }),
      DataIngestionLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent activities
    const recentReports = await Report.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("generatedBy", "username fullName")
      .select("title reportType status createdAt")
      .lean();

    return ApiResponse.success(
      res,
      {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        production: {
          totalRecords: totalProduction,
        },
        reports: {
          total: totalReports,
          recent: recentReports,
        },
        alerts: {
          active: activeAlerts,
          critical: criticalAlerts,
        },
        dataIngestion: {
          recentIngestions,
        },
      },
      "Dashboard statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get data ingestion logs
 * @route   GET /api/admin/ingestion-logs
 * @access  Private/Admin
 */
export const getIngestionLogs = async (req, res, next) => {
  try {
    const { status, sourceType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      DataIngestionLog.find(query)
        .populate("initiatedBy", "username fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DataIngestionLog.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      logs,
      page,
      limit,
      total,
      "Ingestion logs retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getSystemSettings = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = {};
    if (category) query.category = category;

    const settings = await SystemSettings.find(query)
      .populate("lastModifiedBy", "username fullName")
      .sort({ category: 1, key: 1 })
      .lean();

    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    return ApiResponse.success(
      res,
      groupedSettings,
      "System settings retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system setting
 * @route   PUT /api/admin/settings/:key
 * @access  Private/Admin
 */
export const updateSystemSetting = async (req, res, next) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return ApiResponse.error(res, "Value is required", 400);
    }

    const setting = await SystemSettings.findOne({ key: req.params.key });

    if (!setting) {
      return ApiResponse.error(res, "Setting not found", 404);
    }

    if (!setting.isEditable) {
      return ApiResponse.error(res, "This setting is not editable", 403);
    }

    setting.value = value;
    setting.lastModifiedBy = req.user._id;
    setting.lastModifiedAt = new Date();

    await setting.save();

    return ApiResponse.success(res, setting, "Setting updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system health status
 * @route   GET /api/admin/health
 * @access  Private/Admin
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    // Check database connection
    const dbStatus = (await User.findOne({}).lean())
      ? "connected"
      : "disconnected";

    // Get recent failed ingestions
    const failedIngestions = await DataIngestionLog.countDocuments({
      status: "failed",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Get pending reports
    const pendingReports = await Report.countDocuments({
      status: { $in: ["pending", "generating"] },
    });

    // Memory usage (if available)
    const memoryUsage = process.memoryUsage();

    return ApiResponse.success(
      res,
      {
        status: "healthy",
        timestamp: new Date(),
        database: {
          status: dbStatus,
        },
        dataIngestion: {
          failedLast24h: failedIngestions,
        },
        reports: {
          pending: pendingReports,
        },
        system: {
          uptime: process.uptime(),
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
          },
        },
      },
      "System health retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

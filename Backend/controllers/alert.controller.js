// backend/controllers/alert.controller.js
import Alert from "../models/alerts.model.js";
import ApiResponse from "../utils/apiResponse.js";
/**
 * @desc    Get all alerts with filters and pagination
 * @route   GET /api/alerts
 * @access  Private
 */
export const getAlerts = async (req, res, next) => {
  try {
    const {
      alertType,
      severity,
      status,
      province,
      district,
      crop,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (alertType) query.alertType = alertType;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (province) query.province = province;
    if (district) query.district = district;
    if (crop) query.cropType = crop;

    // Filter by user role
    if (!query.targetRoles) {
      query.$or = [
        { targetRoles: req.user.role },
        { targetRoles: "all" },
        { targetUsers: req.user._id },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate("province", "name code")
        .populate("district", "name code")
        .populate("cropType", "name code")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      alerts,
      page,
      limit,
      total,
      "Alerts retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single alert by ID
 * @route   GET /api/alerts/:id
 * @access  Private
 */
export const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("province", "name code")
      .populate("district", "name code")
      .populate("cropType", "name code")
      .populate("acknowledgedBy.user", "username fullName")
      .populate("resolvedBy", "username fullName");

    if (!alert) {
      return ApiResponse.error(res, "Alert not found", 404);
    }

    return ApiResponse.success(res, alert, "Alert retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread alerts count
 * @route   GET /api/alerts/unread/count
 * @access  Private
 */
export const getUnreadAlertsCount = async (req, res, next) => {
  try {
    const query = {
      status: "active",
      $or: [
        { targetRoles: req.user.role },
        { targetRoles: "all" },
        { targetUsers: req.user._id },
      ],
      "acknowledgedBy.user": { $ne: req.user._id },
    };

    const count = await Alert.countDocuments(query);

    return ApiResponse.success(
      res,
      { unreadCount: count },
      "Unread alerts count retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active alerts (unresolved)
 * @route   GET /api/alerts/active
 * @access  Private
 */
export const getActiveAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      status: "active",
      $or: [
        { targetRoles: req.user.role },
        { targetRoles: "all" },
        { targetUsers: req.user._id },
      ],
    };

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate("province", "name code")
        .populate("district", "name code")
        .populate("cropType", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      alerts,
      page,
      limit,
      total,
      "Active alerts retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get critical alerts
 * @route   GET /api/alerts/critical
 * @access  Private
 */
export const getCriticalAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      severity: "critical",
      status: { $in: ["active", "acknowledged"] },
      $or: [
        { targetRoles: req.user.role },
        { targetRoles: "all" },
        { targetUsers: req.user._id },
      ],
    };

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate("province", "name code")
        .populate("district", "name code")
        .populate("cropType", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      alerts,
      page,
      limit,
      total,
      "Critical alerts retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new alert
 * @route   POST /api/alerts
 * @access  Private (Admin only)
 */
export const createAlert = async (req, res, next) => {
  try {
    const {
      title,
      message,
      alertType,
      severity,
      targetRoles,
      targetUsers,
      province,
      district,
      cropType,
      metadata,
    } = req.body;

    // Validation
    if (!title || !message || !alertType) {
      return ApiResponse.error(
        res,
        "Title, message, and alert type are required",
        400
      );
    }

    const alert = await Alert.create({
      alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      alertType,
      severity: severity || "medium",
      targetRoles: targetRoles || ["all"],
      targetUsers: targetUsers || [],
      province,
      district,
      cropType,
      metadata,
      deliveryChannels: {
        inApp: true,
        email: severity === "critical" || severity === "high",
      },
    });

    return ApiResponse.created(res, alert, "Alert created successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Acknowledge alert
 * @route   PUT /api/alerts/:id/acknowledge
 * @access  Private
 */
export const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return ApiResponse.error(res, "Alert not found", 404);
    }

    // Check if already acknowledged by this user
    const alreadyAcknowledged = alert.acknowledgedBy.some(
      (ack) => ack.user.toString() === req.user._id.toString()
    );

    if (alreadyAcknowledged) {
      return ApiResponse.error(res, "Alert already acknowledged by you", 400);
    }

    // Add acknowledgment
    alert.acknowledgedBy.push({
      user: req.user._id,
      acknowledgedAt: new Date(),
    });

    // Update status if not already acknowledged
    if (alert.status === "active") {
      alert.status = "acknowledged";
    }

    await alert.save();

    return ApiResponse.success(res, alert, "Alert acknowledged successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resolve alert
 * @route   PUT /api/alerts/:id/resolve
 * @access  Private (Admin, Policy Maker)
 */
export const resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return ApiResponse.error(res, "Alert not found", 404);
    }

    if (alert.status === "resolved") {
      return ApiResponse.error(res, "Alert already resolved", 400);
    }

    alert.status = "resolved";
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes;

    await alert.save();

    return ApiResponse.success(res, alert, "Alert resolved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete alert
 * @route   DELETE /api/alerts/:id
 * @access  Private (Admin only)
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return ApiResponse.error(res, "Alert not found", 404);
    }

    return ApiResponse.success(res, null, "Alert deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alerts summary
 * @route   GET /api/alerts/summary
 * @access  Private
 */
export const getAlertsSummary = async (req, res, next) => {
  try {
    const userQuery = {
      $or: [
        { targetRoles: req.user.role },
        { targetRoles: "all" },
        { targetUsers: req.user._id },
      ],
    };

    const [totalAlerts, activeAlerts, criticalAlerts, unacknowledgedAlerts] =
      await Promise.all([
        Alert.countDocuments(userQuery),
        Alert.countDocuments({ ...userQuery, status: "active" }),
        Alert.countDocuments({
          ...userQuery,
          severity: "critical",
          status: { $ne: "resolved" },
        }),
        Alert.countDocuments({
          ...userQuery,
          status: "active",
          "acknowledgedBy.user": { $ne: req.user._id },
        }),
      ]);

    // Get alerts by type
    const alertsByType = await Alert.aggregate([
      { $match: userQuery },
      {
        $group: {
          _id: "$alertType",
          count: { $sum: 1 },
        },
      },
    ]);

    return ApiResponse.success(
      res,
      {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        unacknowledgedAlerts,
        alertsByType: alertsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      "Alerts summary retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

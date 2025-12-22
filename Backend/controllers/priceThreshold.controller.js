// backend/controllers/priceThreshold.controller.js
import PriceThreshold from "../models/priceThreshold.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";
import ApiResponse from "../utils/apiResponse.js";
import * as PriceMonitorService from "../services/priceMonitor.service.js";
import { v4 as uuidv4 } from "uuid";

/**
 * @desc    Get all price thresholds (user's own + global)
 * @route   GET /api/price-thresholds
 * @access  Private
 */
export const getThresholds = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isActive } = req.query;
        const userId = req.user._id;

        // Build query: user's own OR global thresholds
        const query = {
            $or: [
                { createdBy: userId },
                { isGlobal: true }
            ]
        };

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [thresholds, total] = await Promise.all([
            PriceThreshold.find(query)
                .populate("cropType", "name")
                .populate("district", "name")
                .populate("createdBy", "fullName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            PriceThreshold.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            data: thresholds,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single price threshold
 * @route   GET /api/price-thresholds/:id
 * @access  Private
 */
export const getThresholdById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const threshold = await PriceThreshold.findOne({
            _id: id,
            $or: [{ createdBy: userId }, { isGlobal: true }],
        })
            .populate("cropType", "name")
            .populate("district", "name")
            .populate("createdBy", "fullName email");

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: threshold,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new price threshold
 * @route   POST /api/price-thresholds
 * @access  Private
 */
export const createThreshold = async (req, res, next) => {
    try {
        const {
            cropType,
            district,
            thresholdType,
            upperLimit,
            lowerLimit,
            percentageChange,
            alertSeverity,
            cooldownHours,
            isGlobal,
        } = req.body;

        // Validation
        if (!cropType || !thresholdType) {
            return res.status(400).json({
                success: false,
                message: "Crop type and threshold type are required",
            });
        }

        if (thresholdType === "above" && !upperLimit) {
            return res.status(400).json({
                success: false,
                message: "Upper limit is required for 'above' threshold type",
            });
        }

        if (thresholdType === "below" && !lowerLimit) {
            return res.status(400).json({
                success: false,
                message: "Lower limit is required for 'below' threshold type",
            });
        }

        if (thresholdType === "both" && (!upperLimit || !lowerLimit)) {
            return res.status(400).json({
                success: false,
                message: "Both upper and lower limits are required for 'both' threshold type",
            });
        }

        // Verify crop exists
        const crop = await CropType.findById(cropType);
        if (!crop) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop type",
            });
        }

        // Verify district if provided
        if (district) {
            const dist = await District.findById(district);
            if (!dist) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid district",
                });
            }
        }

        // Only admins can create global thresholds
        const canCreateGlobal = req.user.role === "admin";
        const finalIsGlobal = canCreateGlobal && isGlobal === true;

        const thresholdId = `PT-${uuidv4().slice(0, 8).toUpperCase()}`;

        const threshold = await PriceThreshold.create({
            thresholdId,
            cropType,
            district: district || null,
            thresholdType,
            upperLimit: upperLimit || null,
            lowerLimit: lowerLimit || null,
            percentageChange: percentageChange || null,
            alertSeverity: alertSeverity || "medium",
            cooldownHours: cooldownHours || 4,
            isGlobal: finalIsGlobal,
            createdBy: req.user._id,
            isActive: true,
        });

        const populatedThreshold = await PriceThreshold.findById(threshold._id)
            .populate("cropType", "name")
            .populate("district", "name");

        return res.status(201).json({
            success: true,
            message: "Price threshold created successfully",
            data: populatedThreshold,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update price threshold
 * @route   PUT /api/price-thresholds/:id
 * @access  Private
 */
export const updateThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const threshold = await PriceThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        // Only owner or admin can update
        if (!threshold.createdBy.equals(userId) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this threshold",
            });
        }

        const {
            thresholdType,
            upperLimit,
            lowerLimit,
            percentageChange,
            alertSeverity,
            cooldownHours,
            isGlobal,
        } = req.body;

        // Update fields
        if (thresholdType) threshold.thresholdType = thresholdType;
        if (upperLimit !== undefined) threshold.upperLimit = upperLimit;
        if (lowerLimit !== undefined) threshold.lowerLimit = lowerLimit;
        if (percentageChange !== undefined) threshold.percentageChange = percentageChange;
        if (alertSeverity) threshold.alertSeverity = alertSeverity;
        if (cooldownHours !== undefined) threshold.cooldownHours = cooldownHours;

        // Only admin can change global status
        if (isAdmin && isGlobal !== undefined) {
            threshold.isGlobal = isGlobal;
        }

        await threshold.save();

        const updatedThreshold = await PriceThreshold.findById(id)
            .populate("cropType", "name")
            .populate("district", "name");

        return res.status(200).json({
            success: true,
            message: "Threshold updated successfully",
            data: updatedThreshold,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle threshold active status
 * @route   PUT /api/price-thresholds/:id/toggle
 * @access  Private
 */
export const toggleThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const threshold = await PriceThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        // Only owner or admin can toggle
        if (!threshold.createdBy.equals(userId) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to modify this threshold",
            });
        }

        threshold.isActive = !threshold.isActive;
        await threshold.save();

        return res.status(200).json({
            success: true,
            message: `Threshold ${threshold.isActive ? "activated" : "deactivated"}`,
            data: { isActive: threshold.isActive },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete price threshold
 * @route   DELETE /api/price-thresholds/:id
 * @access  Private
 */
export const deleteThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const threshold = await PriceThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        // Only owner or admin can delete
        if (!threshold.createdBy.equals(userId) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this threshold",
            });
        }

        await PriceThreshold.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Threshold deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Manually trigger check for a threshold
 * @route   POST /api/price-thresholds/:id/check
 * @access  Private
 */
export const checkThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;

        const threshold = await PriceThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        const result = await PriceMonitorService.checkSingleThreshold(threshold.thresholdId);

        return res.status(200).json({
            success: true,
            message: result.alertCreated
                ? "Threshold breached - alert created"
                : "Threshold checked - no alert needed",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Trigger check for all thresholds (Admin only)
 * @route   POST /api/price-thresholds/check-all
 * @access  Private/Admin
 */
export const checkAllThresholds = async (req, res, next) => {
    try {
        const result = await PriceMonitorService.checkAllThresholds();

        return res.status(200).json({
            success: true,
            message: `Checked ${result.checked} thresholds, created ${result.alertsCreated} alerts`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

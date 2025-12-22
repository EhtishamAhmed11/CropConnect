// backend/controllers/tollThreshold.controller.js
import TollThreshold from "../models/tollThreshold.model.js";
import TollRate from "../models/tollRate.model.js";
import ApiResponse from "../utils/apiResponse.js";
import * as TollMonitorService from "../services/tollMonitor.service.js";
import { v4 as uuidv4 } from "uuid";

/**
 * @desc    Get all toll thresholds (user's own + global)
 * @route   GET /api/toll-thresholds
 * @access  Private
 */
export const getTollThresholds = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isActive } = req.query;
        const userId = req.user._id;

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
            TollThreshold.find(query)
                .populate("tollRoute")
                .populate("createdBy", "fullName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            TollThreshold.countDocuments(query),
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
 * @desc    Create new toll threshold
 * @route   POST /api/toll-thresholds
 * @access  Private
 */
export const createTollThreshold = async (req, res, next) => {
    try {
        const {
            tollRoute,
            vehicleType,
            maxTollAmount,
            alertSeverity,
            cooldownHours,
            isGlobal,
        } = req.body;

        if (!vehicleType || !maxTollAmount) {
            return res.status(400).json({
                success: false,
                message: "Vehicle type and max toll amount are required",
            });
        }

        // Verify toll route if provided
        if (tollRoute) {
            const route = await TollRate.findById(tollRoute);
            if (!route) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid toll route",
                });
            }
        }

        const canCreateGlobal = req.user.role === "admin";
        const finalIsGlobal = canCreateGlobal && isGlobal === true;

        const thresholdId = `TT-${uuidv4().slice(0, 8).toUpperCase()}`;

        const threshold = await TollThreshold.create({
            thresholdId,
            tollRoute: tollRoute || null,
            vehicleType,
            maxTollAmount,
            alertSeverity: alertSeverity || "medium",
            cooldownHours: cooldownHours || 24,
            isGlobal: finalIsGlobal,
            createdBy: req.user._id,
            isActive: true,
        });

        const populated = await TollThreshold.findById(threshold._id)
            .populate("tollRoute");

        return res.status(201).json({
            success: true,
            message: "Toll threshold created successfully",
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle toll threshold active status
 * @route   PUT /api/toll-thresholds/:id/toggle
 * @access  Private
 */
export const toggleTollThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const threshold = await TollThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        if (!threshold.createdBy.equals(userId) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
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
 * @desc    Delete toll threshold
 * @route   DELETE /api/toll-thresholds/:id
 * @access  Private
 */
export const deleteTollThreshold = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const threshold = await TollThreshold.findById(id);

        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: "Threshold not found",
            });
        }

        if (!threshold.createdBy.equals(userId) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        await TollThreshold.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Threshold deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all toll rates
 * @route   GET /api/toll-thresholds/rates
 * @access  Private
 */
export const getTollRates = async (req, res, next) => {
    try {
        const { highwayType } = req.query;

        const query = { isActive: true };
        if (highwayType) {
            query.highwayType = highwayType;
        }

        const rates = await TollRate.find(query).sort({ routeName: 1 }).lean();

        return res.status(200).json({
            success: true,
            data: rates,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Trigger check for all toll thresholds (Admin only)
 * @route   POST /api/toll-thresholds/check-all
 * @access  Private/Admin
 */
export const checkAllTollThresholds = async (req, res, next) => {
    try {
        const result = await TollMonitorService.checkAllTollThresholds();

        return res.status(200).json({
            success: true,
            message: `Checked ${result.checked} thresholds, created ${result.alertsCreated} alerts`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

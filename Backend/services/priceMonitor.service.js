// backend/services/priceMonitor.service.js
import PriceThreshold from "../models/priceThreshold.model.js";
import MarketPrice from "../models/marketPrice.model.js";
import Alert from "../models/alerts.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Check if enough time has passed since last trigger (cooldown check)
 */
const shouldTriggerAlert = (threshold) => {
    if (!threshold.lastTriggered) return true;

    const hoursSinceLastTrigger =
        (Date.now() - new Date(threshold.lastTriggered).getTime()) / (1000 * 60 * 60);

    return hoursSinceLastTrigger >= threshold.cooldownHours;
};

/**
 * Get the latest market price for a crop and optionally a district
 */
const getLatestPrice = async (cropTypeId, districtId = null) => {
    const query = { cropType: cropTypeId };
    if (districtId) {
        query.district = districtId;
    }

    const latestPrice = await MarketPrice.findOne(query)
        .sort({ date: -1 })
        .lean();

    return latestPrice;
};

/**
 * Evaluate if a threshold is breached
 */
const evaluateThreshold = (threshold, currentPrice) => {
    if (!currentPrice || currentPrice <= 0) return { breached: false };

    let breached = false;
    let reason = "";

    switch (threshold.thresholdType) {
        case "above":
            if (threshold.upperLimit && currentPrice > threshold.upperLimit) {
                breached = true;
                reason = `Price (${currentPrice}) exceeded upper limit (${threshold.upperLimit})`;
            }
            break;
        case "below":
            if (threshold.lowerLimit && currentPrice < threshold.lowerLimit) {
                breached = true;
                reason = `Price (${currentPrice}) dropped below lower limit (${threshold.lowerLimit})`;
            }
            break;
        case "both":
            if (threshold.upperLimit && currentPrice > threshold.upperLimit) {
                breached = true;
                reason = `Price (${currentPrice}) exceeded upper limit (${threshold.upperLimit})`;
            } else if (threshold.lowerLimit && currentPrice < threshold.lowerLimit) {
                breached = true;
                reason = `Price (${currentPrice}) dropped below lower limit (${threshold.lowerLimit})`;
            }
            break;
    }

    return { breached, reason, currentPrice };
};

/**
 * Create a price alert
 */
const createPriceAlert = async (threshold, currentPrice, reason, cropName, districtName) => {
    const alertId = `PRICE-${uuidv4().slice(0, 8).toUpperCase()}`;

    const alert = await Alert.create({
        alertId,
        title: `Price Alert: ${cropName}`,
        message: `${reason}. ${districtName ? `Location: ${districtName}` : "All regions"}`,
        alertType: "price_alert",
        severity: threshold.alertSeverity,
        status: "active",
        targetRoles: threshold.isGlobal ? ["all"] : [],
        targetUsers: threshold.isGlobal ? [] : [threshold.createdBy],
        cropType: threshold.cropType,
        district: threshold.district,
        metadata: {
            thresholdId: threshold.thresholdId,
            currentPrice,
            upperLimit: threshold.upperLimit,
            lowerLimit: threshold.lowerLimit,
            triggeredAt: new Date(),
        },
        deliveryChannels: {
            inApp: true,
            email: threshold.alertSeverity === "critical" || threshold.alertSeverity === "high",
        },
    });

    // Update threshold tracking
    await PriceThreshold.findByIdAndUpdate(threshold._id, {
        lastTriggered: new Date(),
        $inc: { triggerCount: 1 },
    });

    console.log(`[PriceMonitor] Created alert: ${alertId} for ${cropName}`);
    return alert;
};

/**
 * Main function to check all active price thresholds
 */
export const checkAllThresholds = async () => {
    console.log("[PriceMonitor] Starting threshold check...");

    const activeThresholds = await PriceThreshold.find({ isActive: true })
        .populate("cropType", "name")
        .populate("district", "name")
        .lean();

    console.log(`[PriceMonitor] Found ${activeThresholds.length} active thresholds`);

    let alertsCreated = 0;

    for (const threshold of activeThresholds) {
        try {
            // Check cooldown
            if (!shouldTriggerAlert(threshold)) {
                console.log(`[PriceMonitor] Threshold ${threshold.thresholdId} is in cooldown`);
                continue;
            }

            // Get latest price
            const latestPriceDoc = await getLatestPrice(threshold.cropType._id, threshold.district?._id);

            if (!latestPriceDoc) {
                console.log(`[PriceMonitor] No price data for threshold ${threshold.thresholdId}`);
                continue;
            }

            // Evaluate threshold
            const result = evaluateThreshold(threshold, latestPriceDoc.price);

            if (result.breached) {
                await createPriceAlert(
                    threshold,
                    result.currentPrice,
                    result.reason,
                    threshold.cropType.name,
                    threshold.district?.name
                );
                alertsCreated++;
            }
        } catch (error) {
            console.error(`[PriceMonitor] Error processing threshold ${threshold.thresholdId}:`, error);
        }
    }

    console.log(`[PriceMonitor] Check complete. Created ${alertsCreated} alerts.`);
    return { checked: activeThresholds.length, alertsCreated };
};

/**
 * Check a single threshold (for testing or manual trigger)
 */
export const checkSingleThreshold = async (thresholdId) => {
    const threshold = await PriceThreshold.findOne({ thresholdId, isActive: true })
        .populate("cropType", "name")
        .populate("district", "name");

    if (!threshold) {
        throw new Error("Threshold not found or inactive");
    }

    const latestPriceDoc = await getLatestPrice(threshold.cropType._id, threshold.district?._id);

    if (!latestPriceDoc) {
        return { breached: false, message: "No price data available" };
    }

    const result = evaluateThreshold(threshold, latestPriceDoc.price);

    if (result.breached && shouldTriggerAlert(threshold)) {
        await createPriceAlert(
            threshold,
            result.currentPrice,
            result.reason,
            threshold.cropType.name,
            threshold.district?.name
        );
        return { breached: true, alertCreated: true, ...result };
    }

    return { breached: result.breached, alertCreated: false, ...result };
};

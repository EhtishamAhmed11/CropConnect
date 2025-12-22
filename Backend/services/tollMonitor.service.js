// backend/services/tollMonitor.service.js
import TollThreshold from "../models/tollThreshold.model.js";
import TollRate from "../models/tollRate.model.js";
import Alert from "../models/alerts.model.js";
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
 * Get vehicle type key for rates object
 */
const getVehicleRateKey = (vehicleType) => {
    const keyMap = {
        car: "car",
        wagon: "wagon",
        wagonUpto12Seater: "wagonUpto12Seater",
        coasterMiniBus: "coasterMiniBus",
        bus: "bus",
        twoThreeAxleTruck: "twoThreeAxleTruck",
        articulatedTruck: "articulatedTruck",
    };
    return keyMap[vehicleType] || "car";
};

/**
 * Create a toll alert
 */
const createTollAlert = async (threshold, tollRate, currentToll) => {
    const alertId = `TOLL-${uuidv4().slice(0, 8).toUpperCase()}`;

    const alert = await Alert.create({
        alertId,
        title: `Toll Alert: ${tollRate.routeName}`,
        message: `Toll for ${threshold.vehicleType} on ${tollRate.routeSegment} (${currentToll} PKR) exceeds your limit (${threshold.maxTollAmount} PKR)`,
        alertType: "toll_alert",
        severity: threshold.alertSeverity,
        status: "active",
        targetRoles: threshold.isGlobal ? ["all"] : [],
        targetUsers: threshold.isGlobal ? [] : [threshold.createdBy],
        metadata: {
            thresholdId: threshold.thresholdId,
            routeId: tollRate.routeId,
            routeName: tollRate.routeName,
            routeSegment: tollRate.routeSegment,
            vehicleType: threshold.vehicleType,
            currentToll,
            maxTollAmount: threshold.maxTollAmount,
            triggeredAt: new Date(),
        },
        deliveryChannels: {
            inApp: true,
            email: threshold.alertSeverity === "critical" || threshold.alertSeverity === "high",
        },
    });

    // Update threshold tracking
    await TollThreshold.findByIdAndUpdate(threshold._id, {
        lastTriggered: new Date(),
        $inc: { triggerCount: 1 },
    });

    console.log(`[TollMonitor] Created alert: ${alertId} for ${tollRate.routeName}`);
    return alert;
};

/**
 * Main function to check all active toll thresholds
 */
export const checkAllTollThresholds = async () => {
    console.log("[TollMonitor] Starting toll threshold check...");

    const activeThresholds = await TollThreshold.find({ isActive: true })
        .populate("tollRoute")
        .lean();

    console.log(`[TollMonitor] Found ${activeThresholds.length} active toll thresholds`);

    let alertsCreated = 0;

    for (const threshold of activeThresholds) {
        try {
            // Check cooldown
            if (!shouldTriggerAlert(threshold)) {
                console.log(`[TollMonitor] Threshold ${threshold.thresholdId} is in cooldown`);
                continue;
            }

            // Get toll rate
            let tollRate = threshold.tollRoute;

            // If no specific route, check all routes
            if (!tollRate) {
                const allRoutes = await TollRate.find({ isActive: true }).lean();
                for (const route of allRoutes) {
                    const rateKey = getVehicleRateKey(threshold.vehicleType);
                    const currentToll = route.rates?.[rateKey] || 0;

                    if (currentToll > threshold.maxTollAmount) {
                        await createTollAlert(threshold, route, currentToll);
                        alertsCreated++;
                    }
                }
                continue;
            }

            // Check specific route
            const rateKey = getVehicleRateKey(threshold.vehicleType);
            const currentToll = tollRate.rates?.[rateKey] || 0;

            if (currentToll > threshold.maxTollAmount) {
                await createTollAlert(threshold, tollRate, currentToll);
                alertsCreated++;
            }
        } catch (error) {
            console.error(`[TollMonitor] Error processing threshold ${threshold.thresholdId}:`, error);
        }
    }

    console.log(`[TollMonitor] Check complete. Created ${alertsCreated} alerts.`);
    return { checked: activeThresholds.length, alertsCreated };
};

/**
 * Get all toll rates for a route
 */
export const getTollRatesForRoute = async (routeId) => {
    return await TollRate.findOne({ routeId }).lean();
};

/**
 * Calculate total toll for a journey (multiple routes)
 */
export const calculateJourneyToll = async (routeIds, vehicleType) => {
    const rateKey = getVehicleRateKey(vehicleType);
    let totalToll = 0;

    for (const routeId of routeIds) {
        const route = await TollRate.findOne({ routeId }).lean();
        if (route?.rates?.[rateKey]) {
            totalToll += route.rates[rateKey];
        }
    }

    return totalToll;
};

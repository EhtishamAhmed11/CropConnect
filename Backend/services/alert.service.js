
// backend/services/alert.service.js
import { v4 as uuidv4 } from "uuid";
import Alert from "../models/alerts.model.js";
import DataIngestionLog from "../models/dataIngestionLog.model.js";
import User from "../models/user.model.js";

/**
 * Log the start of an ingestion process
 */
export const logIngestionStart = async (sourceType, dataType, initiatedByUserId) => {
    try {
        // Map to valid enums if needed, or use defaults
        const validSourceTypes = ["PBS", "MNFSR", "USDA_FAS", "Provincial_CRS", "CSV_Upload", "API", "Manual_Entry"];
        const validDataTypes = ["production", "consumption", "geographic", "other"];

        // Default to 'CSV_Upload' if not valid, as our scripts use 'Batch Script' or 'CSV Import'
        const finalSourceType = validSourceTypes.includes(sourceType) ? sourceType : "CSV_Upload";

        // Default to 'production' if not valid
        const finalDataType = validDataTypes.includes(dataType) ? dataType : "production";

        const log = await DataIngestionLog.create({
            ingestionId: uuidv4(),
            sourceType: finalSourceType,
            dataType: finalDataType,
            status: "processing", // Correct enum value
            initiatedBy: initiatedByUserId || null, // System if null
            startedAt: new Date(),
        });
        return log._id;
    } catch (error) {
        console.error("Failed to log ingestion start:", error);
        return null;
    }
};

/**
 * Log the completion or failure of an ingestion process
 */
export const logIngestionEnd = async (logId, status, recordsProcessed, error = null) => {
    if (!logId) return;

    try {
        const validStatuses = ["pending", "processing", "completed", "failed", "partial"];
        let finalStatus = status;

        if (!validStatuses.includes(status)) {
            finalStatus = error ? "failed" : "completed";
        }

        const update = {
            status: finalStatus,
            completedAt: new Date(),
            recordsProcessed,
        };

        if (error) {
            update.errorMessage = error.message;
            // errorDetails might not be in schema, let's check. 
            // Schema has 'errors' array, but let's stick to standard fields or 'notes'.
            // Schema has 'notes', let's use that for stack trace if needed.
            update.notes = `Error: ${error.message}`;
        }

        await DataIngestionLog.findByIdAndUpdate(logId, update);
    } catch (err) {
        console.error("Failed to log ingestion end:", err);
    }
};

/**
 * Create a system health alert (e.g. for failed ingestion)
 */
export const createSystemAlert = async (title, message, severity = "medium", metadata = {}) => {
    try {
        // Check if a similar active alert already exists to avoid spam
        const existing = await Alert.findOne({
            title,
            status: "active",
            alertType: "system_health",
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24h
        });

        if (existing) return existing;

        const alert = await Alert.create({
            alertId: `SYS-${Date.now()}`,
            title,
            message,
            alertType: "system_health",
            severity,
            targetRoles: ["admin"],
            metadata,
        });
        return alert;
    } catch (error) {
        console.error("Failed to create system alert:", error);
    }
};

/**
 * Create a production anomaly alert
 */
export const createProductionAlert = async (cropName, regionName, year, anomalyData) => {
    try {
        const alert = await Alert.create({
            alertId: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: `${anomalyData.type}: ${cropName} in ${regionName}`,
            message: `${cropName} production in ${regionName} for ${year} changed by ${anomalyData.percentChange}% compared to previous year. (Prev: ${anomalyData.prevValue}, Curr: ${anomalyData.currValue})`,
            alertType: "production_drop", // Enum value
            severity: anomalyData.severity,
            targetRoles: ["admin", "government_policy_maker"],
            metadata: anomalyData,
        });
        return alert;
    } catch (error) {
        console.error("Failed to create production alert:", error);
    }
};

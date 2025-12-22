import cron from "node-cron";
import * as WeatherService from "./services/weather.service.js";
import * as EmailService from "./services/email.service.js";
import * as PriceMonitorService from "./services/priceMonitor.service.js";
import * as TollMonitorService from "./services/tollMonitor.service.js";
import Alert from "./models/alerts.model.js";
import MarketPrice from "./models/marketPrice.model.js";
import User from "./models/user.model.js";
import importAllCrops from "./scripts/import/importAll.js";

const setupScheduler = () => {
    console.log("Initializing Scheduler...");

    // 0. Crop Data Ingestion (PBS): Every 24 hours at 1:00 AM
    cron.schedule("0 1 * * *", async () => {
        console.log("[Scheduler] Starting automatic crop data ingestion (PBS)...");
        try {
            await importAllCrops();
            console.log("[Scheduler] Crop data ingestion completed.");
        } catch (error) {
            console.error("[Scheduler] Crop data ingestion failed:", error);
        }
    });

    // 1. Weather Update: Every 4 hours (0 */4 * * *)
    cron.schedule("0 */4 * * *", async () => {
        console.log("[Scheduler] Starting periodic weather update...");
        try {
            await WeatherService.updateAllDistrictsWeather();
            console.log("[Scheduler] Weather update completed.");
        } catch (error) {
            console.error("[Scheduler] Weather update failed:", error);
        }
    });

    // 2. Daily Report: Every day at 8:00 AM (0 8 * * *)
    cron.schedule("0 8 * * *", async () => {
        console.log("[Scheduler] Generating daily reports...");
        try {
            // Gather Data
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const alertsCount = await Alert.countDocuments({ createdAt: { $gte: today } });
            const latestWheat = await MarketPrice.findOne({ "cropType.name": /wheat/i }).sort({ date: -1 });

            const reportData = {
                alertsCount,
                wheatPrice: latestWheat?.price
            };

            // Find users subscribed to reports (Mocking 'role' based targeting)
            // In real app, check user.preferences.receiveEmails
            const users = await User.find({ "email": { $exists: true } }).limit(5);

            for (const user of users) {
                await EmailService.sendDailyReport(user.email, reportData);
            }
            console.log(`[Scheduler] Sent daily reports to ${users.length} users.`);

        } catch (error) {
            console.error("[Scheduler] Daily report failed:", error);
        }
    });

    // 3. Price Threshold Monitoring: Every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        console.log("[Scheduler] Checking price thresholds...");
        try {
            const result = await PriceMonitorService.checkAllThresholds();
            console.log(`[Scheduler] Price check complete: ${result.alertsCreated} alerts created.`);
        } catch (error) {
            console.error("[Scheduler] Price threshold check failed:", error);
        }
    });

    // 4. Toll Threshold Monitoring: Every 6 hours (toll rates change less frequently)
    cron.schedule("0 */6 * * *", async () => {
        console.log("[Scheduler] Checking toll thresholds...");
        try {
            const result = await TollMonitorService.checkAllTollThresholds();
            console.log(`[Scheduler] Toll check complete: ${result.alertsCreated} alerts created.`);
        } catch (error) {
            console.error("[Scheduler] Toll threshold check failed:", error);
        }
    });
};

export default setupScheduler;


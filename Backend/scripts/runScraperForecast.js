import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDb from "../connection/db.connection.js";
import { runMarketScraper } from "../services/marketScraper.service.js";
import { runMarketForecasts } from "../services/marketForecast.service.js";

const runScraperForecast = async () => {
    await connectDb();

    try {
        console.log("--- STARTING SCRAPER ---");
        const scraperRes = await runMarketScraper();
        console.log("Scraper result:", scraperRes);

        console.log("--- STARTING FORECASTER ---");
        const forecastRes = await runMarketForecasts();
        console.log("Forecaster result:", forecastRes);

        console.log("--- COMPLETED SUCCESSFULLY ---");
    } catch (error) {
        console.error("Execution failed:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

runScraperForecast();

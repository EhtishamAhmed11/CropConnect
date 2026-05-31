import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import connectDb from "./connection/db.connection.js";
import seedPredictions from "./seeds/06-predictions.seed.js";
import mongoose from "mongoose";

const run = async () => {
    try {
        await connectDb();
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Mongoose connection is not ready or failed to establish.");
        }
        console.log("Database connected. Starting prediction seed...");
        await seedPredictions();
        console.log("Prediction seed completed successfully.");
    } catch (err) {
        console.error("Prediction seed failed:", err);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(0);
    }
};

run();

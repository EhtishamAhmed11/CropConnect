import mongoose from "mongoose";
import dotenv from "dotenv";
import seed2024Data from "../Backend/seeds/2024_25_data.seed.js";

dotenv.config({ path: "./Backend/.env" });

const run = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        await seed2024Data();

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();

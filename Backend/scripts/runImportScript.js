import "dotenv/config";
import mongoose from "mongoose";
import importAllCrops from "./import/importAll.js";
import connectDb from "../connection/db.connection.js";

const run = async () => {
    try {
        await connectDb();
        await importAllCrops();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();

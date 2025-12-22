import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDb from "../connection/db.connection.js";
import District from "../models/district.model.js";
import { fetchWeatherForDistrict } from "../services/weather.service.js";

const testWeather = async () => {
    await connectDb();

    try {
        // Find a district with coordinates
        const district = await District.findOne({ "coordinates.latitude": { $exists: true } });

        if (!district) {
            console.log("No district with coordinates found.");
            return;
        }

        console.log(`Fetching weather for ${district.name}...`);
        const weather = await fetchWeatherForDistrict(district._id);

        console.log("Weather fetched successfully:");
        console.log(JSON.stringify(weather, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testWeather();

import mongoose from 'mongoose';
import District from '../models/district.model.js';
import Weather from '../models/weather.model.js';
import dotenv from 'dotenv';

dotenv.config();

const seedWeather = async () => {
    try {
        console.log("🌦️  Seeding Weather Data...");

        // Clear existing weather data
        await Weather.deleteMany({});
        console.log("   - Cleared existing weather records");

        const districts = await District.find({});
        if (districts.length === 0) {
            console.log("   - No districts found to seed weather for.");
            return;
        }

        const conditions = [
            { main: "Clear", desc: "clear sky" },
            { main: "Clouds", desc: "scattered clouds" },
            { main: "Rain", desc: "light rain" },
            { main: "Rain", desc: "heavy intensity rain" },
            { main: "Haze", desc: "haze" },
            { main: "Smoke", desc: "smoke" }
        ];

        const weatherRecords = [];

        for (const district of districts) {
            // Generate 30 days of history
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i)); // Past to Present

                // Simulate seasonal curve (hotter in summer) - simplified random
                const baseTemp = 25;
                const tempVariation = Math.random() * 15;

                const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
                const isRain = randomCondition.main === "Rain";

                weatherRecords.push({
                    district: district._id,
                    temperature: Math.floor(baseTemp + tempVariation),
                    humidity: Math.floor(Math.random() * (80 - 30) + 30),
                    rainfall: isRain ? Math.floor(Math.random() * 20) : 0,
                    windSpeed: Math.floor(Math.random() * 25),
                    condition: randomCondition.main,
                    description: randomCondition.desc,
                    timestamp: date
                });
            }
        }

        await Weather.insertMany(weatherRecords);
        console.log(`   - Created weather records for ${weatherRecords.length} districts`);
        console.log("✅ Weather seeding completed");

    } catch (error) {
        console.error("❌ Weather seeding failed:", error);
        throw error;
    }
};

export default seedWeather;

// Run if executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Only connect if running directly
    const connectDb = async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            await seedWeather();
            await mongoose.disconnect();
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    connectDb();
}

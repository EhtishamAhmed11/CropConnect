import Weather from "../models/weather.model.js";
import District from "../models/district.model.js";
import Alert from "../models/alerts.model.js";
import { v4 as uuidv4 } from "uuid";

// Fetch weather for a specific district
export const fetchWeatherForDistrict = async (districtId) => {
    try {
        const district = await District.findById(districtId);
        if (!district) {
            throw new Error("District not found");
        }

        if (!district.coordinates || !district.coordinates.latitude || !district.coordinates.longitude) {
            console.warn(`District ${district.name} has no coordinates. Skipping weather fetch.`);
            return null;
        }

        const { latitude, longitude } = district.coordinates;
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            throw new Error("WEATHER_API_KEY is not defined");
        }

        // specific API call for current weather
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.statusText}`);
        }
        const data = await response.json();

        // Map API response to our schema
        const weatherData = {
            district: district._id,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            rainfall: data.rain ? data.rain["1h"] || 0 : 0, // 1h rainfall volume
            windSpeed: data.wind.speed,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            timestamp: new Date()
        };

        // Upsert weather data (update if exists for this district, insert otherwise)
        // Actually, we might want to keep history? The requirement says "Historical & Real-Time". 
        // For now getting latest. To store history, we should just .create() new entries. 
        // But for the "Current Weather" display, we might want a quick lookup.
        // Let's just create a new entry every time for history, but we might index by date.

        const newWeather = await Weather.create(weatherData);

        // Check for alerts
        await checkWeatherAlerts(district, newWeather);

        return newWeather;

    } catch (error) {
        console.error(`Error fetching weather for district ${districtId}:`, error);
        throw error;
    }
};

// Fetch weather for all districts
export const updateAllDistrictsWeather = async () => {
    try {
        const districts = await District.find({ "coordinates.latitude": { $exists: true } });
        console.log(`Fetching weather for ${districts.length} districts...`);

        const results = [];
        for (const district of districts) {
            // Add delay to avoid rate limiting if necessary (OpenWeatherMap free tier is 60 calls/min)
            await new Promise(r => setTimeout(r, 1000));
            try {
                const result = await fetchWeatherForDistrict(district._id);
                if (result) results.push(result);
            } catch (e) {
                console.error(`Failed to update for ${district.name}`);
            }
        }
        return results;
    } catch (error) {
        console.error("Error updating all districts:", error);
        throw error;
    }
};

// Check thresholds and generate alerts
const checkWeatherAlerts = async (district, weather) => {
    // Example Thresholds (customize as needed)
    const EXTREME_TEMP_HIGH = 40;
    const EXTREME_RAIN_HIGH = 50; // mm/h

    let alertData = null;

    if (weather.temperature >= EXTREME_TEMP_HIGH) {
        alertData = {
            title: "Extreme Heat Alert",
            message: `Temperature in ${district.name} has reached ${weather.temperature}°C.`,
            severity: "high",
            alertType: "weather_alert"
        };
    } else if (weather.rainfall >= EXTREME_RAIN_HIGH) {
        alertData = {
            title: "Heavy Rainfall Alert",
            message: `Heavy rain detected in ${district.name} (${weather.rainfall} mm).`,
            severity: "high",
            alertType: "weather_alert"
        };
    }

    if (alertData) {
        // Check if a similar active alert exists to avoid spamming
        const existingAlert = await Alert.findOne({
            "district": district._id,
            "alertType": "weather_alert",
            "title": alertData.title,
            "status": "active",
            "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingAlert) {
            await Alert.create({
                alertId: `W-${uuidv4().substring(0, 8)}`,
                ...alertData,
                district: district._id,
                province: district.province,
                relatedEntity: {
                    entityType: "system", // or create a 'weather' entity type if strict
                },
                targetRoles: ["all"]
            });
            console.log(`Alert generated for ${district.name}`);
        }
    }
};

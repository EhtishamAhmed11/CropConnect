import Weather from "../models/weather.model.js";
import District from "../models/district.model.js";
import Alert from "../models/alerts.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "./email.service.js";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory cache for forecast data (avoid excessive API calls)
const forecastCache = new Map();
const FORECAST_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Fetch weather for a specific district (current + forecast)
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

        // Fetch current weather
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.statusText}`);
        }
        const data = await response.json();

        // Fetch 5-day forecast and aggregate into daily summaries
        const forecast = await fetchForecastData(latitude, longitude, apiKey);

        // Map API response to our schema
        const weatherData = {
            district: district._id,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            rainfall: data.rain ? data.rain["1h"] || 0 : 0,
            windSpeed: data.wind.speed,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            forecast: forecast,
            timestamp: new Date()
        };

        const newWeather = await Weather.create(weatherData);

        // Check for alerts
        await checkWeatherAlerts(district, newWeather);

        return newWeather;

    } catch (error) {
        console.error(`Error fetching weather for district ${districtId}:`, error);
        throw error;
    }
};

// Fetch 5-day/3-hour forecast and aggregate into daily summaries
const fetchForecastData = async (latitude, longitude, apiKey) => {
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cached = forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FORECAST_CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Forecast API Error: ${response.statusText}`);
            return [];
        }
        const data = await response.json();

        // Aggregate 3-hour intervals into daily summaries
        const dailyMap = {};
        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = {
                    date: new Date(dateKey),
                    temps: [],
                    conditions: [],
                    rainProbs: [],
                    icons: []
                };
            }

            dailyMap[dateKey].temps.push(item.main.temp);
            dailyMap[dateKey].conditions.push(item.weather[0].main);
            dailyMap[dateKey].rainProbs.push(item.pop || 0);
            dailyMap[dateKey].icons.push(item.weather[0].icon);
        }

        // Convert to daily forecast array
        const forecast = Object.values(dailyMap)
            .slice(0, 7) // Limit to 7 days
            .map(day => {
                // Find the most common condition
                const conditionCounts = {};
                day.conditions.forEach(c => {
                    conditionCounts[c] = (conditionCounts[c] || 0) + 1;
                });
                const dominantCondition = Object.entries(conditionCounts)
                    .sort((a, b) => b[1] - a[1])[0][0];

                // Pick the icon that appears most at midday
                const middayIcon = day.icons[Math.floor(day.icons.length / 2)] || day.icons[0];

                return {
                    date: day.date,
                    temperatureMax: Math.round(Math.max(...day.temps) * 10) / 10,
                    temperatureMin: Math.round(Math.min(...day.temps) * 10) / 10,
                    condition: dominantCondition,
                    rainfallProb: Math.round(Math.max(...day.rainProbs) * 100),
                    icon: middayIcon
                };
            });

        forecastCache.set(cacheKey, { data: forecast, timestamp: Date.now() });
        return forecast;

    } catch (error) {
        console.error("Error fetching forecast:", error);
        return [];
    }
};

// Get forecast for a district (from latest weather record or fresh fetch)
export const getForecastForDistrict = async (districtId) => {
    // Try to get from latest weather record first
    const latestWeather = await Weather.findOne({ district: districtId })
        .sort({ createdAt: -1 })
        .lean();

    // If forecast exists and is recent (less than 30 min old), return it
    if (latestWeather?.forecast?.length > 0) {
        const age = Date.now() - new Date(latestWeather.createdAt).getTime();
        if (age < FORECAST_CACHE_TTL) {
            return {
                current: {
                    temperature: latestWeather.temperature,
                    humidity: latestWeather.humidity,
                    rainfall: latestWeather.rainfall,
                    windSpeed: latestWeather.windSpeed,
                    condition: latestWeather.condition,
                    description: latestWeather.description,
                    icon: latestWeather.icon,
                    timestamp: latestWeather.timestamp
                },
                forecast: latestWeather.forecast
            };
        }
    }

    // Otherwise fetch fresh data
    const district = await District.findById(districtId);
    if (!district?.coordinates?.latitude) {
        return { current: latestWeather || null, forecast: [] };
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        return { current: latestWeather || null, forecast: [] };
    }

    const forecast = await fetchForecastData(
        district.coordinates.latitude,
        district.coordinates.longitude,
        apiKey
    );

    return {
        current: latestWeather ? {
            temperature: latestWeather.temperature,
            humidity: latestWeather.humidity,
            rainfall: latestWeather.rainfall,
            windSpeed: latestWeather.windSpeed,
            condition: latestWeather.condition,
            description: latestWeather.description,
            icon: latestWeather.icon,
            timestamp: latestWeather.timestamp
        } : null,
        forecast
    };
};

// Fetch weather for all districts
export const updateAllDistrictsWeather = async () => {
    try {
        const districts = await District.find({ "coordinates.latitude": { $exists: true } });
        console.log(`Fetching weather for ${districts.length} districts...`);

        const results = [];
        for (const district of districts) {
            // Add delay to avoid rate limiting (OpenWeatherMap free tier is 60 calls/min)
            await new Promise(r => setTimeout(r, 1100));
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

// Check thresholds and generate alerts (+ send emails)
const checkWeatherAlerts = async (district, weather) => {
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
            "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingAlert) {
            const newAlert = await Alert.create({
                alertId: `W-${uuidv4().substring(0, 8)}`,
                ...alertData,
                district: district._id,
                province: district.province,
                relatedEntity: {
                    entityType: "system",
                },
                targetRoles: ["all"]
            });
            console.log(`Alert generated for ${district.name}`);

            // Send email notifications to subscribed users
            try {
                await sendAlertEmails(newAlert, district);
            } catch (emailErr) {
                console.error("Failed to send alert emails:", emailErr.message);
            }
        }
    }
};

// Send alert emails to users who have email preferences enabled
const sendAlertEmails = async (alert, district) => {
    try {
        // Find users with email field (in production, check user preferences)
        const users = await User.find({ email: { $exists: true, $ne: "" } })
            .select("email fullName")
            .limit(20)
            .lean();

        if (users.length === 0) return;

        const severityColors = {
            critical: "#dc2626",
            high: "#ea580c",
            medium: "#d97706",
            low: "#2563eb"
        };
        const color = severityColors[alert.severity] || "#2563eb";

        for (const user of users) {
            const html = `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                    <div style="background: ${color}; padding: 24px 32px; color: white;">
                        <h1 style="margin: 0; font-size: 20px;">⚠️ ${alert.title}</h1>
                        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${district.name} District</p>
                    </div>
                    <div style="padding: 24px 32px;">
                        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">${alert.message}</p>
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <p style="margin: 0; color: #64748b; font-size: 13px;">
                                <strong>Severity:</strong> <span style="color: ${color}; text-transform: uppercase; font-weight: bold;">${alert.severity}</span>
                            </p>
                            <p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">
                                <strong>Alert ID:</strong> ${alert.alertId}
                            </p>
                        </div>
                        <a href="http://localhost:5173/alerts" style="display: inline-block; background: ${color}; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            View in Dashboard
                        </a>
                    </div>
                    <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">CropConnect Alert System</p>
                    </div>
                </div>
            `;

            try {
                await sendEmail(user.email, `🔔 ${alert.title} — ${district.name}`, html);
            } catch (e) {
                console.error(`Failed to email ${user.email}:`, e.message);
            }
        }
    } catch (error) {
        console.error("Error sending alert emails:", error.message);
    }
};

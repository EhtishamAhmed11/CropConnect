import * as WeatherService from "../services/weather.service.js";
import Weather from "../models/weather.model.js";
import District from "../models/district.model.js";

// @desc    Get latest weather for a district (by code or id)
// @route   GET /api/weather/district/:identifier
// @access  Public
export const getDistrictWeather = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const district = await findDistrict(identifier);

        if (!district) {
            return res.status(404).json({ success: false, message: "District not found" });
        }

        // Get latest weather
        const weather = await Weather.findOne({ district: district._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: weather
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get weather forecast for a district (current + 7-day)
// @route   GET /api/weather/forecast/:identifier
// @access  Public
export const getDistrictForecast = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const district = await findDistrict(identifier);

        if (!district) {
            return res.status(404).json({ success: false, message: "District not found" });
        }

        const forecastData = await WeatherService.getForecastForDistrict(district._id);

        return res.status(200).json({
            success: true,
            data: {
                district: {
                    id: district._id,
                    name: district.name,
                    code: district.code
                },
                ...forecastData
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Trigger explicit update for a district
// @route   POST /api/weather/update/:id
// @access  Admin/System
export const updateWeather = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await WeatherService.fetchWeatherForDistrict(id);

        return res.status(200).json({
            success: true,
            data: result,
            message: "Weather updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Trigger generic update for all districts
// @route   POST /api/weather/update-all
// @access  Admin
export const updateAllWeather = async (req, res, next) => {
    try {
        // Run in background so request doesn't timeout
        WeatherService.updateAllDistrictsWeather().then(() => {
            console.log("Background weather update completed.");
        }).catch(err => {
            console.error("Background weather update failed:", err);
        });

        return res.status(200).json({
            success: true,
            message: "Weather update started in background"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get weather history for a district
// @route   GET /api/weather/history/:identifier
// @access  Public
export const getDistrictWeatherHistory = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const district = await findDistrict(identifier);

        if (!district) {
            return res.status(404).json({ success: false, message: "District not found" });
        }

        // Get last 30 days history
        const history = await Weather.find({ district: district._id })
            .sort({ timestamp: 1 }) // Ascending for chart
            .limit(30);

        return res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get weather impact on Wheat, Rice, Cotton for a district
// @route   GET /api/weather/crop-impact/:identifier
// @access  Public
export const getCropImpact = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const district = await findDistrict(identifier);

        if (!district) {
            return res.status(404).json({ success: false, message: "District not found" });
        }

        const forecastData = await WeatherService.getForecastForDistrict(district._id);
        const { current, forecast = [] } = forecastData;

        // Crop-specific thresholds (Pakistan agronomics)
        const CROP_PROFILES = {
            wheat: {
                name: "Wheat",
                emoji: "🌾",
                optimalTempMin: 12,
                optimalTempMax: 25,
                heatStressTemp: 30,
                coldStressTemp: 5,
                droughtRainfallProb: 20,    // Below this → drought risk
                floodRainfallProb: 70,      // Above this → flood risk
                humidityDisease: 80,        // Above this → fungal risk
                season: "Oct–Apr (Rabi)",
            },
            rice: {
                name: "Rice",
                emoji: "🌿",
                optimalTempMin: 20,
                optimalTempMax: 35,
                heatStressTemp: 38,
                coldStressTemp: 15,
                droughtRainfallProb: 40,
                floodRainfallProb: 85,
                humidityDisease: 85,
                season: "Jun–Oct (Kharif)",
            },
            cotton: {
                name: "Cotton",
                emoji: "🪴",
                optimalTempMin: 25,
                optimalTempMax: 38,
                heatStressTemp: 42,
                coldStressTemp: 18,
                droughtRainfallProb: 25,
                floodRainfallProb: 65,
                humidityDisease: 75,
                season: "Apr–Oct (Kharif)",
            },
        };

        // Evaluate a single day/current conditions for a crop
        const evaluateConditions = (temp, rainfallProb, humidity, profile) => {
            const risks = [];
            let riskLevel = "good"; // good | caution | high

            if (temp !== undefined && temp !== null) {
                if (temp > profile.heatStressTemp) {
                    risks.push({ type: "heat", label: "Heat Stress", detail: `${Math.round(temp)}°C exceeds ${profile.heatStressTemp}°C threshold` });
                    riskLevel = "high";
                } else if (temp < profile.coldStressTemp) {
                    risks.push({ type: "cold", label: "Cold Stress", detail: `${Math.round(temp)}°C below ${profile.coldStressTemp}°C threshold` });
                    riskLevel = "high";
                } else if (temp > profile.optimalTempMax) {
                    risks.push({ type: "warm", label: "Above Optimal Temp", detail: `${Math.round(temp)}°C slightly above optimal` });
                    if (riskLevel === "good") riskLevel = "caution";
                } else if (temp < profile.optimalTempMin) {
                    risks.push({ type: "cool", label: "Below Optimal Temp", detail: `${Math.round(temp)}°C slightly below optimal` });
                    if (riskLevel === "good") riskLevel = "caution";
                }
            }

            if (rainfallProb !== undefined) {
                if (rainfallProb > profile.floodRainfallProb) {
                    risks.push({ type: "flood", label: "Flood/Waterlogging Risk", detail: `${rainfallProb}% rainfall probability` });
                    if (riskLevel !== "high") riskLevel = "caution";
                } else if (rainfallProb < profile.droughtRainfallProb) {
                    risks.push({ type: "drought", label: "Drought Risk", detail: `Only ${rainfallProb}% rainfall probability` });
                    if (riskLevel === "good") riskLevel = "caution";
                }
            }

            if (humidity !== undefined && humidity > profile.humidityDisease) {
                risks.push({ type: "disease", label: "Fungal Disease Risk", detail: `${humidity}% humidity favours plant diseases` });
                if (riskLevel === "good") riskLevel = "caution";
            }

            return { riskLevel, risks };
        };

        // Recommendations per risk type
        const RECOMMENDATIONS = {
            heat: "Increase irrigation frequency; apply mulching to conserve soil moisture.",
            cold: "Protect crops with row covers where possible; delay planting if cold snap persists.",
            warm: "Monitor crop closely; ensure adequate water supply.",
            cool: "Ensure soil remains warm; consider delayed planting guidance.",
            flood: "Check drainage systems; avoid field operations during heavy rain.",
            drought: "Schedule supplemental irrigation; prioritise drought-resilient varieties.",
            disease: "Apply preventive fungicide; ensure good canopy ventilation.",
        };

        // Generate per-crop analysis
        const crops = Object.entries(CROP_PROFILES).map(([key, profile]) => {
            // Current conditions
            const currentTemp = current?.temperature;
            const currentHumidity = current?.humidity;
            const currentEval = evaluateConditions(currentTemp, null, currentHumidity, profile);

            // Forecast impact (next 10 days)
            const forecastImpact = forecast.slice(0, 10).map(day => {
                const avgTemp = day.temperatureMax !== undefined
                    ? (day.temperatureMax + day.temperatureMin) / 2
                    : null;
                const eval_ = evaluateConditions(avgTemp, day.rainfallProb, null, profile);
                return {
                    date: day.date,
                    temperatureMax: day.temperatureMax,
                    temperatureMin: day.temperatureMin,
                    condition: day.condition,
                    rainfallProb: day.rainfallProb,
                    riskLevel: eval_.riskLevel,
                    risks: eval_.risks,
                };
            });

            // Overall risk = worst of current + forecast
            const allRisks = [currentEval.riskLevel, ...forecastImpact.map(f => f.riskLevel)];
            const overallRisk = allRisks.includes("high") ? "high"
                : allRisks.includes("caution") ? "caution" : "good";

            // Collect unique risk types for recommendations
            const allRiskTypes = new Set([
                ...currentEval.risks.map(r => r.type),
                ...forecastImpact.flatMap(f => f.risks.map(r => r.type)),
            ]);
            const recommendations = [...allRiskTypes].map(t => RECOMMENDATIONS[t]).filter(Boolean);

            return {
                crop: key,
                name: profile.name,
                emoji: profile.emoji,
                season: profile.season,
                current: {
                    temperature: currentTemp,
                    humidity: currentHumidity,
                    condition: current?.condition,
                    ...currentEval,
                },
                forecastImpact,
                overallRisk,
                recommendations: recommendations.slice(0, 3),
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                district: { id: district._id, name: district.name, code: district.code },
                crops,
                generatedAt: new Date(),
            }
        });

    } catch (error) {
        next(error);
    }
};

// Helper: Find district by ID, code, or name
async function findDistrict(identifier) {
    let district = null;

    // Try to find by ID first
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        district = await District.findById(identifier);
    }

    // If not found, try by code
    if (!district) {
        district = await District.findOne({ code: identifier.toUpperCase() });
    }

    // If still not found, try by name regex
    if (!district) {
        district = await District.findOne({ name: { $regex: new RegExp(identifier, "i") } });
    }

    return district;
}

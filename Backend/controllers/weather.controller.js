import * as WeatherService from "../services/weather.service.js";
import Weather from "../models/weather.model.js";
import District from "../models/district.model.js";

// @desc    Get latest weather for a district (by code or id)
// @route   GET /api/weather/district/:identifier
// @access  Public
export const getDistrictWeather = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        let district;

        // Try to find by ID first
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            district = await District.findById(identifier);
        }

        // If not found, try by code
        if (!district) {
            district = await District.findOne({ code: identifier.toUpperCase() });
        }

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

// @desc    Trigger explicit update for a district
// @route   POST /api/weather/update/:id
// @access  Admin/System (Protected usually, keeping open for demo)
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
        let district;

        // Try to find by ID first
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            district = await District.findById(identifier);
        }

        // If not found, try by code (e.g. LHR)
        if (!district) {
            district = await District.findOne({ code: identifier.toUpperCase() });
        }

        // If still not found, try by Name regex
        if (!district) {
            district = await District.findOne({ name: { $regex: new RegExp(identifier, "i") } });
        }

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

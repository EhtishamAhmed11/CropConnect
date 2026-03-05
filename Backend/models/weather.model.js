import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema({
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: true
    },
    // Current weather conditions
    temperature: {
        type: Number, // in Celsius
        required: true
    },
    humidity: {
        type: Number, // Percentage
        required: true
    },
    rainfall: {
        type: Number, // mm
        default: 0
    },
    windSpeed: {
        type: Number, // m/s
        default: 0
    },
    condition: {
        type: String, // e.g., "Clear", "Rain", "Clouds"
        required: true
    },
    description: {
        type: String // e.g., "light rain"
    },
    icon: {
        type: String // Icon code from OpenWeatherMap
    },

    // Forecast for next few days (simplified)
    forecast: [{
        date: Date,
        temperatureMax: Number,
        temperatureMin: Number,
        condition: String,
        rainfallProb: Number,
        icon: String
    }],

    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for quick lookup by district
weatherSchema.index({ district: 1 });

const Weather = mongoose.model('Weather', weatherSchema);

export default Weather;

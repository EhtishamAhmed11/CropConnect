import { useState, useEffect } from 'react';
import { Cloud, Sun, Droplets, Wind, CloudRain, CloudSnow, CloudLightning, Loader } from 'lucide-react';
import { weatherAPI } from '../../api/weatherApi';

// Map OWM condition to icon
const getWeatherIcon = (condition, size = 24) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={size} />;
    if (c.includes('snow')) return <CloudSnow size={size} />;
    if (c.includes('thunder')) return <CloudLightning size={size} />;
    if (c.includes('cloud')) return <Cloud size={size} />;
    return <Sun size={size} />;
};

const WeatherWidget = ({ districtId, districtName }) => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!districtId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch current weather
                const weatherRes = await weatherAPI.getDistrictWeather(districtId);
                if (weatherRes.data?.success && weatherRes.data?.data) {
                    setWeather(weatherRes.data.data);
                }

                // Fetch forecast
                try {
                    const forecastRes = await weatherAPI.getForecast(districtId);
                    if (forecastRes.data?.success && forecastRes.data?.data?.forecast) {
                        setForecast(forecastRes.data.data.forecast);
                    }
                } catch (e) {
                    console.warn("Forecast not available");
                }
            } catch (error) {
                console.error("Weather fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [districtId]);

    if (!districtId) return null;
    if (loading) return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 flex items-center justify-center min-h-[200px]">
            <Loader className="animate-spin text-white" size={28} />
        </div>
    );
    if (!weather) return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white/80 text-center">
            No weather data available
        </div>
    );

    const WeatherIcon = getWeatherIcon(weather.condition, 48);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl overflow-hidden">
            {/* Current Weather */}
            <div className="p-8">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Current Weather</p>
                <h3 className="text-white text-xl font-bold mb-4">{districtName}</h3>

                <div className="flex items-center gap-4 mb-6">
                    <div className="text-white/90">{WeatherIcon}</div>
                    <div>
                        <p className="text-white text-5xl font-extrabold leading-none">{Math.round(weather.temperature)}°</p>
                        <p className="text-blue-200 capitalize text-sm mt-1">{weather.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                        <Droplets size={16} className="mx-auto mb-1 text-blue-200" />
                        <p className="text-blue-200 text-[10px] font-bold uppercase">Humidity</p>
                        <p className="text-white font-bold text-sm">{weather.humidity}%</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                        <Wind size={16} className="mx-auto mb-1 text-blue-200" />
                        <p className="text-blue-200 text-[10px] font-bold uppercase">Wind</p>
                        <p className="text-white font-bold text-sm">{weather.windSpeed} m/s</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                        <CloudRain size={16} className="mx-auto mb-1 text-blue-200" />
                        <p className="text-blue-200 text-[10px] font-bold uppercase">Rain</p>
                        <p className="text-white font-bold text-sm">{weather.rainfall} mm</p>
                    </div>
                </div>
            </div>

            {/* Forecast Preview (next 5 days) */}
            {forecast.length > 0 && (
                <div className="bg-black/20 px-6 py-4 border-t border-white/10">
                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-3">Upcoming Forecast</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {forecast.slice(0, 5).map((day, i) => {
                            const d = new Date(day.date);
                            const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];

                            return (
                                <div key={i} className="flex-shrink-0 bg-white/10 rounded-xl px-3 py-2 text-center min-w-[64px] backdrop-blur-sm hover:bg-white/20 transition-colors">
                                    <p className="text-blue-200 text-[10px] font-bold mb-1">{dayName}</p>
                                    <div className="text-white/80 flex justify-center mb-1">
                                        {getWeatherIcon(day.condition, 16)}
                                    </div>
                                    <p className="text-white text-xs font-bold">{Math.round(day.temperatureMax)}°</p>
                                    <p className="text-blue-300 text-[10px]">{Math.round(day.temperatureMin)}°</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;

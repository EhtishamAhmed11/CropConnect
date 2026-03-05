import React, { useState, useEffect, useMemo } from "react";
import { weatherAPI } from "../../api/weatherApi";
import { gisAPI } from "../../api/gisAPI";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import WeatherWidget from "../../components/weather/WeatherWidget";
import {
    Cloud, Sun, Droplets, Wind, CloudRain, CloudSnow, CloudLightning,
    Thermometer, TrendingUp, TrendingDown, AlertTriangle, Calendar
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

// Map OWM condition to icon
const getWeatherIcon = (condition, size = 24) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={size} />;
    if (c.includes('snow')) return <CloudSnow size={size} />;
    if (c.includes('thunder')) return <CloudLightning size={size} />;
    if (c.includes('cloud')) return <Cloud size={size} />;
    return <Sun size={size} />;
};

const WeatherAnalysis = () => {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [weatherHistory, setWeatherHistory] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(false);

    // Fetch district list
    useEffect(() => {
        (async () => {
            try {
                const res = await gisAPI.getDistricts({ page: 1, limit: 200 });
                if (res.data?.data) {
                    const items = res.data.data;
                    setDistricts(items);
                    if (items.length > 0) {
                        setSelectedDistrict(items[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load districts:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Fetch weather when district changes
    useEffect(() => {
        if (!selectedDistrict) return;
        const districtId = selectedDistrict._id || selectedDistrict.code;

        const fetchWeather = async () => {
            setLoading(true);
            setForecastLoading(true);
            try {
                // Fetch history
                const histRes = await weatherAPI.getWeatherHistory(districtId);
                if (histRes.data?.success) {
                    setWeatherHistory(histRes.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }

            try {
                // Fetch forecast
                const forecastRes = await weatherAPI.getForecast(districtId);
                if (forecastRes.data?.success && forecastRes.data?.data?.forecast) {
                    setForecast(forecastRes.data.data.forecast);
                }
            } catch (e) {
                console.warn("Forecast not available");
            } finally {
                setForecastLoading(false);
            }
        };

        fetchWeather();
    }, [selectedDistrict]);

    // Chart data
    const tempData = useMemo(() =>
        weatherHistory.map(w => ({
            date: new Date(w.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: w.temperature,
            humidity: w.humidity
        })), [weatherHistory]);

    const rainData = useMemo(() =>
        weatherHistory.map(w => ({
            date: new Date(w.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rainfall: w.rainfall
        })), [weatherHistory]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Climate insights from history
    const insights = useMemo(() => {
        if (weatherHistory.length < 2) return null;
        const temps = weatherHistory.map(w => w.temperature);
        const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const totalRain = weatherHistory.reduce((a, w) => a + (w.rainfall || 0), 0).toFixed(1);
        const avgHumidity = (weatherHistory.reduce((a, w) => a + w.humidity, 0) / weatherHistory.length).toFixed(0);

        return { avgTemp, maxTemp, minTemp, totalRain, avgHumidity };
    }, [weatherHistory]);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Weather Analysis</h1>
                        <p className="text-slate-500 mt-1">Real-time weather, forecasts, and climate trends for agricultural planning.</p>
                    </div>

                    <select
                        value={selectedDistrict?._id || ""}
                        onChange={(e) => {
                            const d = districts.find(d => d._id === e.target.value);
                            setSelectedDistrict(d);
                        }}
                        className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium shadow-sm min-w-[250px] focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {districts.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {loading && !selectedDistrict ? (
                    <div className="flex items-center justify-center py-20"><Loading /></div>
                ) : (
                    <div className="space-y-8">

                        {/* Row 1: Current Weather Widget + 7-Day Forecast */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Current Weather Widget */}
                            <div className="lg:col-span-1">
                                <WeatherWidget
                                    districtId={selectedDistrict?._id}
                                    districtName={selectedDistrict?.name}
                                />
                            </div>

                            {/* 7-Day Forecast */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="text-blue-600" size={20} />
                                    <h2 className="text-lg font-bold text-slate-800">Extended Forecast</h2>
                                </div>

                                {forecastLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loading />
                                    </div>
                                ) : forecast.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {forecast.map((day, i) => {
                                            const d = new Date(day.date);
                                            const dayName = i === 0 ? 'Today' : dayNamesShort[d.getDay()];
                                            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            const rainColor = day.rainfallProb > 60 ? 'text-blue-600' : day.rainfallProb > 30 ? 'text-blue-400' : 'text-slate-400';

                                            return (
                                                <div key={i} className="bg-slate-50 rounded-xl p-4 text-center hover:bg-blue-50 transition-colors border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">{dayName}</p>
                                                    <p className="text-[10px] text-slate-400 mb-3">{dateStr}</p>
                                                    <div className="flex justify-center mb-3 text-blue-500">
                                                        {getWeatherIcon(day.condition, 28)}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 capitalize mb-2">{day.condition}</p>
                                                    <div className="flex justify-center gap-2 text-sm">
                                                        <span className="font-bold text-slate-900">{Math.round(day.temperatureMax)}°</span>
                                                        <span className="text-slate-400">/</span>
                                                        <span className="text-slate-500">{Math.round(day.temperatureMin)}°</span>
                                                    </div>
                                                    {day.rainfallProb !== undefined && (
                                                        <div className="flex items-center justify-center gap-1 mt-2">
                                                            <Droplets size={12} className={rainColor} />
                                                            <span className={`text-xs font-bold ${rainColor}`}>{day.rainfallProb}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <Cloud size={40} className="mx-auto mb-2" />
                                        <p>No forecast data available for this district.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Climate Summary Tiles */}
                        {insights && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Thermometer size={16} className="text-orange-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Avg Temp</p>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800">{insights.avgTemp}°C</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={16} className="text-red-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Max Temp</p>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">{insights.maxTemp}°C</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown size={16} className="text-blue-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Min Temp</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{insights.minTemp}°C</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CloudRain size={16} className="text-cyan-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Total Rain</p>
                                    </div>
                                    <p className="text-2xl font-bold text-cyan-700">{insights.totalRain} mm</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Droplets size={16} className="text-teal-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Avg Humidity</p>
                                    </div>
                                    <p className="text-2xl font-bold text-teal-700">{insights.avgHumidity}%</p>
                                </div>
                            </div>
                        )}

                        {/* Historical Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Temperature & Humidity Chart */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Temperature & Humidity (30 Days)</h2>
                                {tempData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={tempData}>
                                                <defs>
                                                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                                />
                                                <Area type="monotone" dataKey="temp" stroke="#f97316" fill="url(#tempGrad)" strokeWidth={2} name="Temperature (°C)" />
                                                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#humGrad)" strokeWidth={2} name="Humidity (%)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-12">No historical data</p>
                                )}
                            </div>

                            {/* Rainfall Chart */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Rainfall (30 Days)</h2>
                                {rainData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={rainData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                                />
                                                <Bar dataKey="rainfall" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-12">No rainfall data</p>
                                )}
                            </div>
                        </div>

                        {/* Climate Advisories */}
                        {insights && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="text-amber-600" size={20} />
                                    <h2 className="text-lg font-bold text-amber-900">Climate Advisories</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {parseFloat(insights.avgTemp) > 35 && (
                                        <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-amber-200">
                                            <Thermometer size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-amber-900">Heat Stress Risk</p>
                                                <p className="text-amber-700 mt-1">Average temperatures above 35°C may stress crops. Consider irrigation schedules and heat-tolerant varieties.</p>
                                            </div>
                                        </div>
                                    )}
                                    {parseFloat(insights.totalRain) > 100 && (
                                        <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-amber-200">
                                            <CloudRain size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-amber-900">Flooding Risk</p>
                                                <p className="text-amber-700 mt-1">High total rainfall detected. Monitor drainage and consider waterlogging prevention measures.</p>
                                            </div>
                                        </div>
                                    )}
                                    {parseFloat(insights.avgHumidity) > 80 && (
                                        <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-amber-200">
                                            <Droplets size={18} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-amber-900">Disease Risk</p>
                                                <p className="text-amber-700 mt-1">High humidity levels increase risk of fungal diseases. Apply preventative crop protection measures.</p>
                                            </div>
                                        </div>
                                    )}
                                    {parseFloat(insights.avgTemp) <= 35 && parseFloat(insights.totalRain) <= 100 && parseFloat(insights.avgHumidity) <= 80 && (
                                        <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-green-200 col-span-full">
                                            <Sun size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-green-900">Favorable Conditions</p>
                                                <p className="text-green-700 mt-1">Current climate conditions are within normal range for agricultural activities. Continue standard crop management practices.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WeatherAnalysis;

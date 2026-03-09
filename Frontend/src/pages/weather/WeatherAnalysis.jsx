import React, { useState, useEffect, useMemo } from "react";
import { weatherAPI } from "../../api/weatherApi";
import { gisAPI } from "../../api/gisAPI";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import WeatherWidget from "../../components/weather/WeatherWidget";
import {
    Cloud, Sun, Droplets, Wind, CloudRain, CloudSnow, CloudLightning,
    Thermometer, TrendingUp, TrendingDown, AlertTriangle, Calendar,
    CheckCircle2, AlertCircle, Leaf, Info
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

// ── Weather icon helper ───────────────────────────────────────────────────────
const getWeatherIcon = (condition, size = 24) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={size} />;
    if (c.includes('snow')) return <CloudSnow size={size} />;
    if (c.includes('thunder')) return <CloudLightning size={size} />;
    if (c.includes('cloud')) return <Cloud size={size} />;
    return <Sun size={size} />;
};

// ── Risk styles ───────────────────────────────────────────────────────────────
const RISK_CONFIG = {
    good: { label: "Favorable", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle2, iconColor: "text-emerald-500" },
    caution: { label: "Caution", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", icon: AlertTriangle, iconColor: "text-amber-500" },
    high: { label: "High Risk", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-500", icon: AlertCircle, iconColor: "text-red-500" },
};

const RiskBadge = ({ level, small = false }) => {
    const cfg = RISK_CONFIG[level] || RISK_CONFIG.good;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${small ? "text-xs" : "text-xs"} ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ── Crop Impact Card ──────────────────────────────────────────────────────────
const CropImpactCard = ({ crop }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = RISK_CONFIG[crop.overallRisk] || RISK_CONFIG.good;
    const Icon = cfg.icon;

    return (
        <div className={`rounded-2xl border-2 ${cfg.border} overflow-hidden transition-all duration-300`}>
            {/* Card Header */}
            <div className={`${cfg.bg} p-5`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">{crop.emoji}</div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{crop.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{crop.season}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <RiskBadge level={crop.overallRisk} />
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Icon size={13} className={cfg.iconColor} />
                            <span>{cfg.label} conditions</span>
                        </div>
                    </div>
                </div>

                {/* Current Conditions Row */}
                {crop.current?.temperature != null && (
                    <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Thermometer size={14} className="text-orange-400" />
                            <span className="font-semibold">{Math.round(crop.current.temperature)}°C</span>
                            <span className="text-slate-400">now</span>
                        </div>
                        {crop.current.humidity != null && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Droplets size={14} className="text-blue-400" />
                                <span className="font-semibold">{crop.current.humidity}%</span>
                                <span className="text-slate-400">humidity</span>
                            </div>
                        )}
                        {crop.current.condition && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                                {getWeatherIcon(crop.current.condition, 14)}
                                <span className="capitalize">{crop.current.condition}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Risks */}
                {crop.current.risks?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {crop.current.risks.map((r, i) => (
                            <span key={i} className="text-xs bg-white/60 border border-slate-200 text-slate-600 rounded-lg px-2.5 py-1 font-medium">
                                ⚠ {r.label}
                            </span>
                        ))}
                    </div>
                )}
                {crop.current.risks?.length === 0 && (
                    <div className="mt-3">
                        <span className="text-xs bg-white/60 border border-emerald-200 text-emerald-700 rounded-lg px-2.5 py-1 font-medium">
                            ✓ No active stressors
                        </span>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {crop.recommendations?.length > 0 && (
                <div className="bg-white px-5 py-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Recommendations</p>
                    <ul className="space-y-1.5">
                        {crop.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {crop.recommendations?.length === 0 && (
                <div className="bg-white px-5 py-4 border-t border-slate-100">
                    <p className="text-sm text-emerald-600 font-medium">✓ No specific action required — conditions are favorable.</p>
                </div>
            )}

            {/* 10-Day Forecast Toggle */}
            {crop.forecastImpact?.length > 0 && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-100 text-sm font-bold text-slate-600"
                    >
                        <span>{expanded ? "Hide" : "Show"} 10-Day Forecast Impact</span>
                        <Calendar size={15} />
                    </button>

                    {expanded && (
                        <div className="bg-white border-t border-slate-100 overflow-x-auto">
                            <table className="w-full text-xs min-w-[560px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left">
                                        <th className="px-4 py-2.5 font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wider">Condition</th>
                                        <th className="px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wider text-right">Max/Min °C</th>
                                        <th className="px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wider text-right">Rain %</th>
                                        <th className="px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wider">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {crop.forecastImpact.map((day, i) => {
                                        const d = new Date(day.date);
                                        const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                                        return (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-2.5 font-semibold text-slate-700">{label}</td>
                                                <td className="px-3 py-2.5 text-slate-500 capitalize flex items-center gap-1.5">
                                                    <span className="text-blue-400">{getWeatherIcon(day.condition, 13)}</span>
                                                    {day.condition}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                                                    {day.temperatureMax != null ? `${Math.round(day.temperatureMax)}° / ${Math.round(day.temperatureMin)}°` : "—"}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    {day.rainfallProb != null ? (
                                                        <span className={`font-bold ${day.rainfallProb > 60 ? "text-blue-600" : day.rainfallProb > 30 ? "text-blue-400" : "text-slate-400"}`}>
                                                            {day.rainfallProb}%
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <RiskBadge level={day.riskLevel} small />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const WeatherAnalysis = () => {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [weatherHistory, setWeatherHistory] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [cropImpact, setCropImpact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [cropLoading, setCropLoading] = useState(false);

    // Load districts
    useEffect(() => {
        (async () => {
            try {
                const res = await gisAPI.getDistricts({ page: 1, limit: 200 });
                if (res.data?.data) {
                    const items = res.data.data;
                    setDistricts(items);
                    if (items.length > 0) setSelectedDistrict(items[0]);
                }
            } catch (err) {
                console.error("Failed to load districts:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Fetch weather + crop impact when district changes
    useEffect(() => {
        if (!selectedDistrict) return;
        const id = selectedDistrict._id || selectedDistrict.code;

        const fetchAll = async () => {
            setLoading(true);
            setForecastLoading(true);
            setCropLoading(true);
            setCropImpact(null);

            // History
            try {
                const h = await weatherAPI.getWeatherHistory(id);
                if (h.data?.success) setWeatherHistory(h.data.data || []);
            } catch { /* silent */ } finally { setLoading(false); }

            // Forecast
            try {
                const f = await weatherAPI.getForecast(id);
                if (f.data?.success && f.data?.data?.forecast) setForecast(f.data.data.forecast);
            } catch { /* silent */ } finally { setForecastLoading(false); }

            // Crop Impact
            try {
                const c = await weatherAPI.getCropImpact(id);
                if (c.data?.success) setCropImpact(c.data.data);
            } catch (e) {
                console.warn("Crop impact not available:", e.message);
            } finally { setCropLoading(false); }
        };

        fetchAll();
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

    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                        <p className="text-slate-500 mt-1">Real-time weather, forecasts, and crop impact for agricultural planning.</p>
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
                    <div className="space-y-10">

                        {/* Row 1: Current Widget + 7-Day Forecast */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <WeatherWidget districtId={selectedDistrict?._id} districtName={selectedDistrict?.name} />
                            </div>
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="text-blue-600" size={20} />
                                    <h2 className="text-lg font-bold text-slate-800">Extended Forecast</h2>
                                </div>
                                {forecastLoading ? (
                                    <div className="flex items-center justify-center py-12"><Loading /></div>
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
                                                    <div className="flex justify-center mb-3 text-blue-500">{getWeatherIcon(day.condition, 28)}</div>
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
                                {[
                                    { icon: <Thermometer size={16} className="text-orange-500" />, label: "Avg Temp", value: `${insights.avgTemp}°C`, color: "text-slate-800" },
                                    { icon: <TrendingUp size={16} className="text-red-500" />, label: "Max Temp", value: `${insights.maxTemp}°C`, color: "text-red-600" },
                                    { icon: <TrendingDown size={16} className="text-blue-500" />, label: "Min Temp", value: `${insights.minTemp}°C`, color: "text-blue-600" },
                                    { icon: <CloudRain size={16} className="text-cyan-500" />, label: "Total Rain", value: `${insights.totalRain} mm`, color: "text-cyan-700" },
                                    { icon: <Droplets size={16} className="text-teal-500" />, label: "Avg Humidity", value: `${insights.avgHumidity}%`, color: "text-teal-700" },
                                ].map(({ icon, label, value, color }) => (
                                    <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs font-bold text-slate-500 uppercase">{label}</p></div>
                                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── CROP IMPACT ANALYSIS ────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <Leaf size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Crop Impact Analysis</h2>
                                        <p className="text-sm text-slate-500">
                                            {selectedDistrict?.name} — How current & next 10 days weather affects major crops
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mb-5 mt-3 pl-1">
                                {Object.entries(RISK_CONFIG).map(([key, cfg]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                                        <span className="text-xs text-slate-500 font-medium">{cfg.label}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
                                    <Info size={12} />
                                    Based on Pakistan agronomic thresholds
                                </div>
                            </div>

                            {cropLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loading />
                                </div>
                            ) : cropImpact?.crops?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {cropImpact.crops.map((crop) => (
                                        <CropImpactCard key={crop.crop} crop={crop} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Leaf size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">No crop impact data available.</p>
                                    <p className="text-sm mt-1">Weather data may not be available for this district yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Historical Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                                <Area type="monotone" dataKey="temp" stroke="#f97316" fill="url(#tempGrad)" strokeWidth={2} name="Temperature (°C)" />
                                                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#humGrad)" strokeWidth={2} name="Humidity (%)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-12">No historical data</p>
                                )}
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Rainfall (30 Days)</h2>
                                {rainData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={rainData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
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

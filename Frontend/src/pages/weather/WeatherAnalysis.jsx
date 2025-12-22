import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
} from "recharts";
import {
    Cloud,
    Droplets,
    Wind,
    MapPin,
    Calendar,
    Thermometer,
    Sun,
    Umbrella,
    Search,
    CloudRain,
    Navigation,
    Loader
} from "lucide-react";
import { gisAPI } from "../../api/gisApi";
import { weatherAPI } from "../../api/weatherApi";
import WeatherWidget from "../../components/weather/WeatherWidget";

const CustomTooltip = ({ active, payload, label, unit = "" }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-xs mb-2 font-bold uppercase">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                        {entry.name}: {entry.value} {unit}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
    const colors = {
        orange: "text-orange-600 bg-orange-50",
        blue: "text-blue-600 bg-blue-50",
        cyan: "text-cyan-600 bg-cyan-50",
        yellow: "text-yellow-600 bg-yellow-50",
    };
    const theme = colors[color] || colors.blue;

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${theme} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg">{subtitle}</p>}
        </div>
    );
};

const WeatherAnalysis = () => {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [weatherHistory, setWeatherHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const loadDistricts = async () => {
            try {
                const res = await gisAPI.getDistricts({ limit: 100 });
                if (res.data.success) {
                    setDistricts(res.data.data);
                    if (res.data.data.length > 0) setSelectedDistrict(res.data.data[0]);
                }
            } catch (error) {
                console.error("Failed to load districts", error);
            } finally {
                setPageLoading(false);
            }
        };
        loadDistricts();
    }, []);

    useEffect(() => {
        if (!selectedDistrict) return;
        const loadHistory = async () => {
            setLoading(true);
            try {
                const res = await weatherAPI.getWeatherHistory(selectedDistrict._id);
                if (res.data.success) {
                    const formattedData = res.data.data.map((item) => ({
                        ...item,
                        date: new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    }));
                    setWeatherHistory(formattedData);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [selectedDistrict]);

    const insights = useMemo(() => {
        if (!weatherHistory.length) return null;
        const temps = weatherHistory.map((d) => d.temperature);
        const rain = weatherHistory.map((d) => d.rainfall);
        const humid = weatherHistory.map((d) => d.humidity);

        return {
            maxTemp: Math.max(...temps),
            avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
            totalRain: rain.reduce((a, b) => a + b, 0),
            avgHumid: Math.round(humid.reduce((a, b) => a + b, 0) / humid.length),
        };
    }, [weatherHistory]);

    if (pageLoading) return <Layout><div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-emerald-500" /></div></Layout>;

    return (
        <Layout>
            <div className="font-['Outfit'] space-y-8 p-2">

                {/* Header */}
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-widest text-xs mb-2">
                            <Cloud size={14} /> Meteorological Center
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800">Weather Analytics</h1>
                        <p className="text-slate-500 mt-1">Predictive climate models for agricultural planning.</p>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
                        <select
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 appearance-none cursor-pointer"
                            value={selectedDistrict?._id || ""}
                            onChange={(e) => {
                                const dist = districts.find(d => d._id === e.target.value);
                                setSelectedDistrict(dist);
                            }}
                        >
                            {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Navigation size={16} className="text-slate-400 rotate-180" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Current Stats */}
                    <div className="space-y-6">
                        {selectedDistrict && (
                            <div className="relative overflow-hidden rounded-3xl shadow-2xl text-white">
                                <div className="absolute inset-0 bg-blue-500"></div> {/* Fallback bg */}
                                <div className="relative z-10">
                                    <WeatherWidget districtId={selectedDistrict._id} districtName={selectedDistrict.name} />
                                </div>
                            </div>
                        )}

                        {insights && (
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard title="Highest Temp" value={`${insights.maxTemp}°C`} icon={Thermometer} color="orange" subtitle="Last 30 Days" />
                                <StatCard title="Total Rainfall" value={`${insights.totalRain}mm`} icon={CloudRain} color="blue" subtitle="Accumulated" />
                                <StatCard title="Avg Humidity" value={`${insights.avgHumid}%`} icon={Droplets} color="cyan" subtitle="Mean Level" />
                                <StatCard title="Avg Temp" value={`${insights.avgTemp}°C`} icon={Sun} color="yellow" subtitle="Daily Mean" />
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wind size={100} />
                            </div>
                            <div className="relative z-10 flex gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm h-fit">
                                    <Wind size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-2">Climate Advisory</h4>
                                    <p className="text-indigo-100 text-sm leading-relaxed">
                                        {insights ? (
                                            insights.totalRain > 10
                                                ? `High precipitation detected (${insights.totalRain}mm). Advise farmers to ensure proper drainage and delay moisture-sensitive harvests.`
                                                : insights.maxTemp > 38
                                                    ? `Critical heat alert (${insights.maxTemp}°C). Recommend increasing irrigation frequency for heat-sensitive crops.`
                                                    : insights.avgHumid > 75
                                                        ? `High humidity detected (${insights.avgHumid}%). Monitor crops closely for signs of fungal disease.`
                                                        : "Conditions are stable. Ideal window for routine field operations and maintenance."
                                        ) : "Analyzing climate patterns..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        {loading ? (
                            <div className="h-[400px] flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <Loader className="animate-spin text-slate-300" size={40} />
                            </div>
                        ) : (
                            <>
                                {/* Temp Chart */}
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Thermometer size={20} className="text-orange-500" /> Temperature Trend
                                        </h3>
                                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase">30 Days</span>
                                    </div>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={weatherHistory}>
                                                <defs>
                                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip unit="°C" />} />
                                                <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Rainfall */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <CloudRain size={18} className="text-blue-500" /> Precipitation
                                        </h3>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={weatherHistory}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" hide />
                                                    <Tooltip content={<CustomTooltip unit="mm" />} cursor={{ fill: '#f8fafc' }} />
                                                    <Bar dataKey="rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={8} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Humidity */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <Droplets size={18} className="text-cyan-500" /> Humidity
                                        </h3>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={weatherHistory}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis domain={[0, 100]} hide />
                                                    <Tooltip content={<CustomTooltip unit="%" />} />
                                                    <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={3} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default WeatherAnalysis;

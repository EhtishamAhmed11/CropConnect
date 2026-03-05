import React, { useState, useEffect, useMemo } from "react";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import axios from "axios";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    ComposedChart,
    Cell,
    ReferenceLine,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Cloud,
    Droplets,
    Sun,
    AlertTriangle,
    Zap,
    Leaf,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Info,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const YieldForecasting = () => {
    const { showError } = useAlert();
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState(null);
    const [modelPerformance, setModelPerformance] = useState(null);
    const [regionalComparison, setRegionalComparison] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [showTable, setShowTable] = useState(false);
    const [filters, setFilters] = useState({
        crop: "Wheat",
        region: "Pakistan",
        forecastYear: 2025,
    });

    const crops = [
        { value: "Wheat", label: "Wheat 🌾", icon: "🌾" },
        { value: "Rice", label: "Rice 🍚", icon: "🍚" },
        { value: "Cotton", label: "Cotton 🌱", icon: "🌱" },
    ];

    const regions = [
        { value: "Pakistan", label: "Pakistan (National)" },
        { value: "Punjab", label: "Punjab" },
        { value: "Sindh", label: "Sindh" },
        { value: "KPK", label: "Khyber Pakhtunkhwa" },
        { value: "Balochistan", label: "Balochistan" },
    ];

    const forecastYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

    useEffect(() => {
        fetchTimelineData();
        fetchModelPerformance();
        fetchWeatherContext();
    }, [filters.crop, filters.region]);

    useEffect(() => {
        if (filters.forecastYear) {
            fetchRegionalComparison();
        }
    }, [filters.crop, filters.forecastYear]);

    const fetchTimelineData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/predictions/timeline`, {
                params: { crop: filters.crop, region: filters.region },
            });
            setTimelineData(response.data.data);
        } catch (error) {
            showError("Failed to fetch forecast data");
        } finally {
            setLoading(false);
        }
    };

    const fetchModelPerformance = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/predictions/performance`, {
                params: { crop: filters.crop, region: filters.region },
            });
            if (response.data.data && response.data.data.length > 0) {
                setModelPerformance(response.data.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch model performance");
        }
    };

    const fetchRegionalComparison = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/predictions/regional-comparison`, {
                params: { crop: filters.crop, year: filters.forecastYear },
            });
            setRegionalComparison(response.data.data);
        } catch (error) {
            console.error("Failed to fetch regional comparison");
        }
    };

    const fetchWeatherContext = async () => {
        try {
            // Fetch weather summary - try to get data for a representative district
            const response = await axios.get(`${API_BASE_URL}/weather/district/lahore`);
            if (response.data?.success) {
                setWeatherData(response.data.data);
            }
        } catch (error) {
            // Weather data is supplementary — don't show error
            console.warn("Weather context not available");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Combine historical and forecast data for the chart
    const chartData = timelineData
        ? [
            ...timelineData.historical.map((d) => ({
                year: d.year,
                actual: d.production,
                type: "historical",
            })),
            ...timelineData.forecast.map((d) => ({
                year: d.year.toString(),
                forecast: d.production,
                type: "forecast",
            })),
        ]
        : [];

    // Growth rate analysis between forecast years
    const growthAnalysis = useMemo(() => {
        if (!timelineData?.forecast || timelineData.forecast.length < 2) return [];
        return timelineData.forecast.map((entry, i) => {
            if (i === 0) {
                // compare to last historical
                const lastHistorical = timelineData.historical[timelineData.historical.length - 1];
                const growthRate = lastHistorical ? ((entry.production - lastHistorical.production) / lastHistorical.production * 100) : 0;
                return { year: entry.year, production: entry.production, growthRate: parseFloat(growthRate.toFixed(1)) };
            }
            const prev = timelineData.forecast[i - 1];
            const growthRate = ((entry.production - prev.production) / prev.production * 100);
            return { year: entry.year, production: entry.production, growthRate: parseFloat(growthRate.toFixed(1)) };
        });
    }, [timelineData]);

    // Scenario analysis
    const scenarios = useMemo(() => {
        if (!timelineData?.forecast || timelineData.forecast.length < 2 || !modelPerformance) return null;
        const lastForecast = timelineData.forecast[timelineData.forecast.length - 1];
        const r2 = modelPerformance.testR2 || 0.85;
        const errorMargin = (1 - r2) * 100; // rough % error

        const optimistic = lastForecast.production * (1 + errorMargin / 100);
        const pessimistic = lastForecast.production * (1 - errorMargin / 100);
        const baseline = lastForecast.production;

        return {
            year: lastForecast.year,
            optimistic: Math.round(optimistic),
            baseline: Math.round(baseline),
            pessimistic: Math.round(pessimistic),
            errorMargin: errorMargin.toFixed(1),
        };
    }, [timelineData, modelPerformance]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 font-['Outfit']">
                    <p className="font-bold text-gray-900 mb-2 text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-xs font-medium" style={{ color: entry.color }}>
                                {entry.name}:
                            </span>
                            <span className="text-xs font-bold" style={{ color: entry.color }}>
                                {entry.value?.toLocaleString()} kt
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const formatValue = (val) => {
        if (val >= 1000) return `${(val / 1000).toFixed(2)}M`;
        return `${val.toLocaleString()}k`;
    };

    const getAccuracyLabel = (r2) => {
        if (r2 >= 0.95) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" };
        if (r2 >= 0.85) return { text: "Very Good", color: "text-green-600", bg: "bg-green-50" };
        if (r2 >= 0.70) return { text: "Good", color: "text-blue-600", bg: "bg-blue-50" };
        return { text: "Moderate", color: "text-orange-600", bg: "bg-orange-50" };
    };

    const generateInsights = () => {
        if (!timelineData) return null;

        const hist = timelineData.historical;
        const fore = timelineData.forecast;

        if (hist.length < 2 || fore.length < 2) return null;

        const latestActual = hist[hist.length - 1].production;
        const startForecast = fore[0].production;
        const endForecast = fore[fore.length - 1].production;

        const totalChange = ((endForecast - startForecast) / startForecast * 100).toFixed(1);
        const direction = totalChange >= 0 ? "increase" : "decrease";
        const trend = Math.abs(totalChange) > 10 ? "significant" : "steady";

        return {
            summary: `Our AI predicts a ${trend} ${direction} of ${Math.abs(totalChange)}% in ${filters.crop} production over the next decade in ${filters.region}.`,
            comparison: `The forecast starts at ${formatValue(startForecast)} tonnes in ${fore[0].year} and is expected to reach ${formatValue(endForecast)} tonnes by ${fore[fore.length - 1].year}.`,
            reliability: `This prediction has a reliability score of ${(modelPerformance?.testR2 * 100).toFixed(1)}% based on historical testing.`
        };
    };

    // Crop-weather advisory
    const getCropWeatherAdvisory = () => {
        const advisories = [];
        const cropLower = filters.crop.toLowerCase();

        if (weatherData) {
            if (weatherData.temperature > 35) {
                advisories.push({
                    type: "warning",
                    icon: <Sun size={16} className="text-orange-500" />,
                    title: "Heat Stress Alert",
                    message: `Current temperature at ${Math.round(weatherData.temperature)}°C may affect ${filters.crop} yield. Consider heat-resistant variety adoption to maintain forecasted production levels.`,
                });
            }
            if (weatherData.rainfall > 50) {
                advisories.push({
                    type: "warning",
                    icon: <Droplets size={16} className="text-blue-500" />,
                    title: "Heavy Rainfall",
                    message: `Recent heavy rainfall (${weatherData.rainfall}mm) may affect crop quality. Monitor waterlogging in low-lying areas.`,
                });
            }
            if (weatherData.humidity > 80) {
                advisories.push({
                    type: "info",
                    icon: <Cloud size={16} className="text-teal-500" />,
                    title: "High Humidity",
                    message: `Humidity at ${weatherData.humidity}% increases fungal disease risk for ${filters.crop}. Apply preventative measures.`,
                });
            }
        }

        // Crop-specific strategic advisories
        if (cropLower === "wheat") {
            advisories.push({
                type: "strategic",
                icon: <Target size={16} className="text-indigo-500" />,
                title: "Wheat Strategy",
                message: "Focus on improving seed quality and fertilizer efficiency. Projected demand growth requires 2-3% annual yield improvement.",
            });
        } else if (cropLower === "rice") {
            advisories.push({
                type: "strategic",
                icon: <Target size={16} className="text-indigo-500" />,
                title: "Rice Strategy",
                message: "Water management is the key growth lever. Drip irrigation adoption could improve yields by 15-20% over baseline forecasts.",
            });
        } else if (cropLower === "cotton") {
            advisories.push({
                type: "strategic",
                icon: <Target size={16} className="text-indigo-500" />,
                title: "Cotton Strategy",
                message: "Pest management and Bt cotton adoption are critical. International market prices should guide production volume targets.",
            });
        }

        return advisories;
    };

    // Surplus/Deficit implications from forecast
    const getSupplyImplications = () => {
        if (!timelineData?.forecast || timelineData.forecast.length < 2) return null;
        const lastForecast = timelineData.forecast[timelineData.forecast.length - 1];
        const firstForecast = timelineData.forecast[0];
        const growthPct = ((lastForecast.production - firstForecast.production) / firstForecast.production * 100).toFixed(1);

        const populationGrowthRate = 2.0; // Pakistan's approximate annual population growth %
        const yearsSpan = lastForecast.year - firstForecast.year;
        const demandGrowth = (populationGrowthRate * yearsSpan).toFixed(1);

        const surplusLikely = parseFloat(growthPct) > parseFloat(demandGrowth);

        return {
            productionGrowth: growthPct,
            demandGrowth,
            surplusLikely,
            yearsSpan,
            commentary: surplusLikely
                ? `Production growth (${growthPct}%) is expected to outpace demand growth (${demandGrowth}%), potentially creating surplus opportunities for export or redistribution.`
                : `Demand growth (${demandGrowth}%) may outpace production growth (${growthPct}%). Strategic investment in yield improvement is recommended to avoid deficits.`,
        };
    };

    const insights = generateInsights();
    const advisories = getCropWeatherAdvisory();
    const supplyImplications = getSupplyImplications();
    const accuracyLabel = modelPerformance ? getAccuracyLabel(modelPerformance.testR2) : null;

    return (
        <Layout>
            <div className="space-y-6 font-['Outfit']">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🔮</span>
                                <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs">
                                    AI-Powered Insights
                                </p>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                                Yield Forecasting Dashboard
                            </h1>
                            <p className="text-slate-600 text-sm max-w-2xl">
                                Explore machine learning predictions for crop production from 2024 to 2033.
                                Our AI models analyze historical trends to forecast future yields with high accuracy.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Select Parameters
                            </p>
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Crop Type</label>
                                    <select
                                        name="crop"
                                        value={filters.crop}
                                        onChange={handleFilterChange}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                                    >
                                        {crops.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Region</label>
                                    <select
                                        name="region"
                                        value={filters.region}
                                        onChange={handleFilterChange}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
                                    >
                                        {regions.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Insights Box */}
                            {insights && (
                                <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg shadow-indigo-500/5 mt-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <span className="text-2xl">💡</span>
                                        AI Forecast Insights
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Overall Trend</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{insights.summary}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Growth Path</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{insights.comparison}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">Reliability</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{insights.reliability}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <>
                        {/* Key Metrics Row */}
                        {modelPerformance && timelineData && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <BarChart3 size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Model Accuracy</p>
                                            <p className={`text-lg font-bold ${accuracyLabel.color}`}>
                                                {accuracyLabel.text}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        R² Score: {(modelPerformance.testR2 * 100).toFixed(1)}%
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Target size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Prediction Error</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {modelPerformance.mape?.toFixed(1) || 'N/A'}%
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Mean Absolute Percentage Error
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Zap size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">AI Algorithm</p>
                                            <p className="text-sm font-bold text-purple-600">
                                                {modelPerformance.bestModel}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Optimized for {filters.region}
                                    </p>
                                </div>

                                {/* Supply Implications Tile */}
                                {supplyImplications && (
                                    <div className={`rounded-xl p-5 shadow-sm border ${supplyImplications.surplusLikely ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${supplyImplications.surplusLikely ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                                {supplyImplications.surplusLikely
                                                    ? <ArrowUpRight size={20} className="text-emerald-600" />
                                                    : <ArrowDownRight size={20} className="text-red-600" />}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Supply Outlook</p>
                                                <p className={`text-lg font-bold ${supplyImplications.surplusLikely ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {supplyImplications.surplusLikely ? 'Surplus Likely' : 'Deficit Risk'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            Production +{supplyImplications.productionGrowth}% vs Demand +{supplyImplications.demandGrowth}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Main Timeline Chart */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-1">
                                        Production Timeline: Historical vs Forecast
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Comparing actual production data with AI-generated predictions
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 bg-emerald-500"></div>
                                            <span className="text-xs font-medium text-slate-600">Historical</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 border-t-2 border-dashed border-indigo-500"></div>
                                            <span className="text-xs font-medium text-slate-600">AI Forecast</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTable(!showTable)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-2"
                                    >
                                        {showTable ? "📉 Show Chart" : "📋 Show Table Data"}
                                    </button>
                                </div>
                            </div>

                            {showTable ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Year</th>
                                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Production (kt)</th>
                                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">YoY Growth</th>
                                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Reliability</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chartData.map((row, idx) => {
                                                const growthEntry = row.type === 'forecast' ? growthAnalysis.find(g => g.year.toString() === row.year) : null;
                                                return (
                                                    <tr key={idx} className={`border-b border-slate-50 hover:bg-slate-50/50 ${row.type === 'forecast' ? 'bg-indigo-50/20' : ''}`}>
                                                        <td className="py-3 px-4 font-bold text-slate-700">{row.year}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.type === 'forecast' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {row.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600 font-semibold">
                                                            {(row.actual || row.forecast)?.toLocaleString()} kt
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {growthEntry ? (
                                                                <span className={`text-xs font-bold ${growthEntry.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    {growthEntry.growthRate >= 0 ? '+' : ''}{growthEntry.growthRate}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-slate-500">
                                                            {row.type === 'forecast' ? `${(modelPerformance?.testR2 * 100).toFixed(1)}%` : 'Validated'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis
                                                dataKey="year"
                                                stroke="#94a3b8"
                                                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                                label={{
                                                    value: 'Production (thousand tonnes)',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    style: { fontSize: 12, fill: '#64748b' }
                                                }}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                wrapperStyle={{ fontSize: "13px", paddingTop: "20px", fontWeight: 500 }}
                                                iconType="line"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                fill="url(#colorActual)"
                                                stroke="none"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 6, strokeWidth: 2 }}
                                                name="Actual Production"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="forecast"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                strokeDasharray="8 4"
                                                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 6, strokeWidth: 2 }}
                                                name="AI Forecast"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Chart Explanation */}
                            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">💡</span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">How to Read This Chart</p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            The <span className="font-semibold text-emerald-600">solid green line</span> shows actual historical production data.
                                            The <span className="font-semibold text-indigo-600">dashed blue line</span> represents AI-generated forecasts based on historical patterns,
                                            weather trends, and agricultural data. The shaded area highlights the confidence range of historical data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NEW: Growth Rate + Scenario Analysis Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Growth Rate Chart */}
                            {growthAnalysis.length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <h2 className="text-lg font-bold text-slate-800 mb-1">Year-over-Year Growth Rate</h2>
                                    <p className="text-sm text-slate-500 mb-4">Forecasted annual production change (%)</p>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={growthAnalysis} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                                <Tooltip
                                                    formatter={(value) => `${value}%`}
                                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="growthRate" radius={[4, 4, 0, 0]} name="Growth Rate">
                                                    {growthAnalysis.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.growthRate >= 0 ? '#10b981' : '#ef4444'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Scenario Analysis */}
                            {scenarios && (
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <h2 className="text-lg font-bold text-slate-800 mb-1">Scenario Analysis ({scenarios.year})</h2>
                                    <p className="text-sm text-slate-500 mb-6">Best, baseline, and conservative estimates based on model confidence (±{scenarios.errorMargin}%)</p>

                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right">
                                                <span className="text-xs font-bold text-emerald-600 uppercase">Optimistic</span>
                                            </div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: '100%' }}
                                                ></div>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    {formatValue(scenarios.optimistic)} t
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right">
                                                <span className="text-xs font-bold text-indigo-600 uppercase">Baseline</span>
                                            </div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${(scenarios.baseline / scenarios.optimistic * 100)}%` }}
                                                ></div>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    {formatValue(scenarios.baseline)} t
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right">
                                                <span className="text-xs font-bold text-orange-600 uppercase">Conservative</span>
                                            </div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                                                <div
                                                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${(scenarios.pessimistic / scenarios.optimistic * 100)}%` }}
                                                ></div>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    {formatValue(scenarios.pessimistic)} t
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <div className="flex items-start gap-2">
                                            <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Scenarios are derived from the model's R² confidence interval.
                                                The baseline represents the AI's primary prediction, while optimistic and conservative values reflect the possible variance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* NEW: Supply Implications + Weather Advisories Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Supply vs Demand Implications */}
                            {supplyImplications && (
                                <div className={`rounded-xl p-6 shadow-md border ${supplyImplications.surplusLikely ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Leaf size={20} className={supplyImplications.surplusLikely ? 'text-emerald-600' : 'text-red-600'} />
                                        <h2 className="text-lg font-bold text-slate-800">Supply vs Demand Outlook</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white/70 rounded-xl p-4 border border-white/50">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Production Growth</p>
                                            <p className="text-2xl font-black text-emerald-600">+{supplyImplications.productionGrowth}%</p>
                                            <p className="text-xs text-slate-500">Over {supplyImplications.yearsSpan} years</p>
                                        </div>
                                        <div className="bg-white/70 rounded-xl p-4 border border-white/50">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Demand Growth (Est.)</p>
                                            <p className="text-2xl font-black text-orange-600">+{supplyImplications.demandGrowth}%</p>
                                            <p className="text-xs text-slate-500">Based on population growth</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-700 leading-relaxed">{supplyImplications.commentary}</p>
                                </div>
                            )}

                            {/* Weather-Crop Advisories */}
                            {advisories.length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <h2 className="text-lg font-bold text-slate-800">Crop & Weather Advisory</h2>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">How current weather and strategic factors may affect forecasted yields</p>

                                    <div className="space-y-3">
                                        {advisories.map((adv, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${adv.type === 'warning' ? 'bg-amber-50 border-amber-200' : adv.type === 'info' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                                <div className="mt-0.5 flex-shrink-0">{adv.icon}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{adv.title}</p>
                                                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{adv.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Regional Comparison */}
                        {regionalComparison.length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 mb-1">
                                            Regional Production Forecast
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Predicted {filters.crop.toLowerCase()} production across provinces in {filters.forecastYear}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-slate-600">Forecast Year:</label>
                                        <select
                                            name="forecastYear"
                                            value={filters.forecastYear}
                                            onChange={handleFilterChange}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {forecastYears.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={regionalComparison} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis
                                                dataKey="region"
                                                stroke="#94a3b8"
                                                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                                label={{
                                                    value: 'Predicted Production (kt)',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    style: { fontSize: 12, fill: '#64748b' }
                                                }}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="predictedProduction.value"
                                                fill="#6366f1"
                                                radius={[8, 8, 0, 0]}
                                                name="Predicted Production"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Model Performance Details */}
                        {modelPerformance && (
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span>📈</span>
                                    Model Performance Metrics
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Test R² Score</p>
                                        <p className="text-2xl font-bold text-indigo-600 mb-1">
                                            {(modelPerformance.testR2 * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-slate-600">Model accuracy on test data</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs text-slate-500 font-medium mb-1">CV R² Score</p>
                                        <p className="text-2xl font-bold text-purple-600 mb-1">
                                            {(modelPerformance.cvR2 * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-slate-600">Cross-validation accuracy</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs text-slate-500 font-medium mb-1">RMSE</p>
                                        <p className="text-2xl font-bold text-blue-600 mb-1">
                                            {modelPerformance.testRMSE?.toFixed(1) || 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-600">Root mean squared error (kt)</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs text-slate-500 font-medium mb-1">MAE</p>
                                        <p className="text-2xl font-bold text-emerald-600 mb-1">
                                            {modelPerformance.testMAE?.toFixed(1) || 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-600">Mean absolute error (kt)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default YieldForecasting;

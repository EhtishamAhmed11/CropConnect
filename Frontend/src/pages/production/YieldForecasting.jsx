import React, { useState, useEffect, useMemo } from "react";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import { getTimelineData, getRegionalComparison } from "../../api/predictionAPI";
import { weatherAPI } from "../../api/weatherApi";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
    TrendingUp, AlertTriangle, Cloud, Droplets, Sun, Leaf,
    Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const CROPS = [{ value: "Wheat", label: "Wheat 🌾" }, { value: "Rice", label: "Rice 🍚" }, { value: "Cotton", label: "Cotton 🌱" }];
const REGIONS = [
    { value: "Pakistan", label: "Pakistan (National)" },
    { value: "Punjab", label: "Punjab" },
    { value: "Sindh", label: "Sindh" },
    { value: "KPK", label: "Khyber Pakhtunkhwa" },
    { value: "Balochistan", label: "Balochistan" },
];
const FORECAST_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
const CROP_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 font-['Outfit']">
            <p className="font-bold text-slate-700 text-sm mb-2">{label}</p>
            {payload.map((e, i) => e.value != null && (
                <div key={i} className="flex justify-between gap-6 mb-1">
                    <span className="text-xs font-medium" style={{ color: e.color }}>{e.name}</span>
                    <span className="text-xs font-bold" style={{ color: e.color }}>{e.value.toLocaleString()} kt</span>
                </div>
            ))}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const YieldForecasting = () => {
    const { showError } = useAlert();
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState(null);
    const [regionalData, setRegionalData] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [multiCropData, setMultiCropData] = useState({});
    const [multiCropMode, setMultiCropMode] = useState(false);
    const [filters, setFilters] = useState({ crop: "Wheat", region: "Pakistan", forecastYear: 2028 });

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => { fetchTimeline(); fetchWeather(); }, [filters.crop, filters.region]);
    useEffect(() => { fetchRegional(); }, [filters.crop, filters.forecastYear]);
    useEffect(() => { if (multiCropMode) fetchMultiCrop(); }, [multiCropMode, filters.region]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const result = await getTimelineData(filters.crop, filters.region);
            setTimelineData(result.data);
        } catch { showError("Failed to load forecast data"); }
        finally { setLoading(false); }
    };

    const fetchRegional = async () => {
        try {
            const result = await getRegionalComparison(filters.crop, filters.forecastYear);
            setRegionalData(result.data || []);
        } catch { console.warn("Regional data unavailable"); }
    };

    const fetchWeather = async () => {
        try {
            const r = await weatherAPI.getDistrictWeather("lahore");
            if (r.data?.success) setWeatherData(r.data.data);
        } catch { /* optional */ }
    };

    const fetchMultiCrop = async () => {
        const out = {};
        for (const c of CROPS) {
            try {
                const result = await getTimelineData(c.value, filters.region);
                out[c.value] = result.data;
            } catch { /* skip */ }
        }
        setMultiCropData(out);
    };

    const onChange = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

    // ── Chart data: keys OMITTED (not set to null) where a line has no data ──
    // Recharts drops a line segment for undefined keys; setting null can draw to y=0
    const chartData = useMemo(() => {
        if (!timelineData) return [];
        const map = {};

        // Step 1: Historical rows — convert raw tonnes → kt (÷1000) to match forecast unit
        (timelineData.historical || []).forEach(d => {
            const yr = String(d.year);
            // production.value is in raw tonnes; forecast is seeded in kt → normalise to kt
            map[yr] = { year: yr, actual: Math.round(d.production / 1000) };
        });

        // Step 2: Locate bridge point (last historical year)
        const histYears = Object.keys(map).map(Number).sort((a, b) => a - b);
        const lastHistYear = String(histYears[histYears.length - 1] ?? "");

        // Step 3: Forecast rows — only set "forecast", never include "actual" key
        (timelineData.forecast || []).forEach(d => {
            const yr = String(d.year);
            const val = Math.round(d.production);
            if (!map[yr]) map[yr] = { year: yr };
            map[yr].forecast = val;
            // do NOT set actual here — leave the key absent so Recharts skips it
        });

        // Step 4: Bridge — both lines share a single value at the join point
        // so the green line ends and the blue line starts at the exact same pixel.
        const firstForecastYear = String(timelineData.forecast?.[0]?.year ?? "");
        if (lastHistYear && map[lastHistYear]) {
            // green line: add forecast value at last hist year
            map[lastHistYear].forecast = map[lastHistYear].actual;
        }
        if (firstForecastYear && map[firstForecastYear] && firstForecastYear !== lastHistYear) {
            // blue line: add actual value at first forecast year
            map[firstForecastYear].actual = map[firstForecastYear].forecast;
        }

        return Object.values(map)
            .filter(item => Number(item.year) >= 2008)
            .sort((a, b) => +a.year - +b.year);
    }, [timelineData]);

    // ── Multi-crop data ───────────────────────────────────────────────────────
    const multiData = useMemo(() => {
        if (!multiCropMode) return [];
        const map = {};
        Object.entries(multiCropData).forEach(([name, tl]) => {
            if (!tl) return;
            (tl.historical || []).forEach(d => {
                const yr = String(d.year);
                if (!map[yr]) map[yr] = { year: yr };
                map[yr][name] = Math.round(d.production / 1000);
            });
            (tl.forecast || []).forEach(d => {
                const yr = String(d.year);
                if (!map[yr]) map[yr] = { year: yr };
                map[yr][name] = Math.round(d.production);
            });
        });
        return Object.values(map)
            .filter(item => Number(item.year) >= 2008)
            .sort((a, b) => +a.year - +b.year);
    }, [multiCropData, multiCropMode]);

    // ── Supply implication ────────────────────────────────────────────────────
    const supply = useMemo(() => {
        const fc = timelineData?.forecast;
        if (!fc || fc.length < 2) return null;
        const pct = ((fc[fc.length - 1].production - fc[0].production) / fc[0].production * 100).toFixed(1);
        const dem = (2.0 * (fc[fc.length - 1].year - fc[0].year)).toFixed(1);
        const surplus = parseFloat(pct) > parseFloat(dem);
        return {
            productionGrowth: pct, demandGrowth: dem, surplus,
            note: surplus
                ? `Production (+${pct}%) outpaces estimated demand (+${dem}%), creating surplus/export opportunity.`
                : `Demand (+${dem}%) may outpace production (+${pct}%). Yield improvement required.`,
        };
    }, [timelineData]);

    // ── Weather advisories ────────────────────────────────────────────────────
    const advisories = useMemo(() => {
        const list = [];
        if (weatherData) {
            if (weatherData.temperature > 35) list.push({ icon: <Sun size={15} className="text-orange-500" />, title: "Heat Stress Alert", msg: `${Math.round(weatherData.temperature)}°C — may reduce ${filters.crop} yield.`, type: "warning" });
            if (weatherData.rainfall > 50) list.push({ icon: <Droplets size={15} className="text-blue-500" />, title: "Heavy Rainfall", msg: `${weatherData.rainfall}mm — potential crop damage risk.`, type: "warning" });
            if (weatherData.humidity > 80) list.push({ icon: <Cloud size={15} className="text-teal-500" />, title: "High Humidity", msg: `${weatherData.humidity}% — fungal disease risk elevated.`, type: "info" });
        }
        const c = filters.crop.toLowerCase();
        if (c === "wheat") list.push({ icon: <Target size={15} className="text-indigo-500" />, title: "Wheat Strategy", msg: "Focus on improved seed varieties and balanced fertilization.", type: "strategy" });
        if (c === "rice") list.push({ icon: <Target size={15} className="text-indigo-500" />, title: "Rice Strategy", msg: "Drip irrigation adoption can boost yields 15–20%.", type: "strategy" });
        if (c === "cotton") list.push({ icon: <Target size={15} className="text-indigo-500" />, title: "Cotton Strategy", msg: "Integrated pest management is critical for yield protection.", type: "strategy" });
        return list;
    }, [weatherData, filters.crop]);

    const fmtK = v => v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v.toLocaleString()}k`;

    return (
        <Layout>
            <div className="space-y-6 font-['Outfit'] pb-12">

                {/* ── Header + Filters ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <TrendingUp className="text-indigo-600" size={24} />
                                Yield Forecasting
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Historical crop production merged with AI forecasts through 2033.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            {[
                                { name: "crop", label: "Crop", opts: CROPS },
                                { name: "region", label: "Region", opts: REGIONS },
                            ].map(({ name, label, opts }) => (
                                <div key={name} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                    <select name={name} value={filters[name]} onChange={onChange}
                                        className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer">
                                        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            ))}

                            <label className="flex items-center gap-2 cursor-pointer pb-1">
                                <div
                                    onClick={() => setMultiCropMode(p => !p)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${multiCropMode ? "bg-indigo-500" : "bg-slate-200"}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${multiCropMode ? "translate-x-5" : ""}`} />
                                </div>
                                <span className="text-xs font-bold text-slate-600">Multi-Crop</span>
                            </label>
                        </div>
                    </div>
                </div>

                {loading ? <Loading /> : (
                    <>
                        {/* ── Production Timeline Chart ── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-base font-bold text-slate-800 mb-1">
                                {multiCropMode ? "Multi-Crop Comparison" : `${filters.crop} — Production Timeline (${filters.region})`}
                            </h2>
                            <p className="text-xs text-slate-400 mb-5">
                                {multiCropMode
                                    ? "All three crops overlaid for comparison"
                                    : "Green = actual historical data · Blue = AI predicted forecast"}
                            </p>

                            <div className="h-[420px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {multiCropMode && multiData.length > 0 ? (
                                        <LineChart data={multiData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v}`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} iconType="circle" iconSize={8} />
                                            {CROPS.map((c, i) => (
                                                <Line key={c.value} type="monotone" dataKey={c.value}
                                                    stroke={CROP_COLORS[i]} strokeWidth={2.5}
                                                    dot={false} activeDot={{ r: 5 }}
                                                    name={c.label} connectNulls animationDuration={800} />
                                            ))}
                                        </LineChart>
                                    ) : (
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v}`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} iconType="circle" iconSize={8} />
                                            {/* Actual line — solid green, up to CUTOFF_YEAR */}
                                            <Line
                                                type="monotone" dataKey="actual"
                                                stroke="#10b981" strokeWidth={2.5}
                                                dot={false} activeDot={{ r: 5 }}
                                                name="Actual Production (kt)"
                                                animationDuration={900}
                                            />
                                            {/* Forecast line — solid indigo, from CUTOFF_YEAR onwards */}
                                            <Line
                                                type="monotone" dataKey="forecast"
                                                stroke="#6366f1" strokeWidth={2.5}
                                                dot={false} activeDot={{ r: 5 }}
                                                name="AI Predicted Yield (kt)"
                                                animationDuration={900}
                                            />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ── Supply vs Demand + Weather ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {supply && (
                                <div className={`rounded-2xl p-6 border shadow-sm ${supply.surplus ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                                    <div className="flex items-center gap-2 mb-5">
                                        <Leaf size={18} className={supply.surplus ? "text-emerald-600" : "text-red-600"} />
                                        <h2 className="text-base font-bold text-slate-800">Supply vs Demand Outlook</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white/70 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Production Growth</p>
                                            <p className="text-2xl font-black text-emerald-600">+{supply.productionGrowth}%</p>
                                        </div>
                                        <div className="bg-white/70 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Demand Growth</p>
                                            <p className="text-2xl font-black text-orange-500">+{supply.demandGrowth}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        {supply.surplus
                                            ? <ArrowUpRight size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                            : <ArrowDownRight size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}
                                        <p className="text-sm text-slate-700 leading-relaxed">{supply.note}</p>
                                    </div>
                                </div>
                            )}

                            {advisories.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-5">
                                        <AlertTriangle size={18} className="text-amber-500" />
                                        <h2 className="text-base font-bold text-slate-800">Crop & Weather Advisory</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {advisories.map((a, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.type === "warning" ? "bg-amber-50 border-amber-200" : a.type === "info" ? "bg-blue-50 border-blue-100" : "bg-indigo-50 border-indigo-100"}`}>
                                                <span className="mt-0.5 flex-shrink-0">{a.icon}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{a.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{a.msg}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Regional Comparison ── */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">Regional Production Forecast</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Predicted {filters.crop} output by province</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">Year:</span>
                                    <select name="forecastYear" value={filters.forecastYear} onChange={onChange}
                                        className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        {FORECAST_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="h-64">
                                {regionalData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={regionalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="region" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="predictedProduction.value" name="Predicted (kt)" radius={[6, 6, 0, 0]} animationDuration={800}>
                                                {regionalData.map((_, i) => <Cell key={i} fill={["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"][i % 4]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                        No regional data available for {filters.forecastYear}
                                    </div>
                                )}
                            </div>
                        </div>

                    </>
                )}
            </div>
        </Layout>
    );
};

export default YieldForecasting;
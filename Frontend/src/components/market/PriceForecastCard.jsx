import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    CloudSun,
    Package,
    AlertCircle,
    CheckCircle2,
    Minus
} from 'lucide-react';
import { marketAPI } from '../../api/marketApi';

const PriceForecastCard = ({ cropId, districtId, cropName, districtName }) => {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!cropId || !districtId) return;

        const fetchForecast = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await marketAPI.getForecast(cropId, districtId);
                if (res.data.success) {
                    setForecast(res.data.data);
                } else {
                    setError("No forecast data available.");
                }
            } catch (err) {
                console.error("Error fetching forecast:", err);
                if (err.response && err.response.status === 404) {
                    setError("No forecast available yet for this selection. Forecasts are generated daily at 6:30 AM.");
                } else {
                    setError("Unable to load forecast data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [cropId, districtId]);

    if (!cropId || !districtId) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 shadow-none rounded-3xl p-8">
                <div className="p-4 bg-white rounded-3xl mb-3 shadow-sm border border-slate-100">
                    <TrendingUp className="text-slate-400" size={32} />
                </div>
                <Typography className="text-slate-600 font-bold text-sm tracking-wide">Select a crop and location</Typography>
                <Typography className="text-slate-400 text-xs mt-1">to see price forecasts & driver breakdown</Typography>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl p-8 flex justify-center items-center min-h-[350px]">
                <div className="flex flex-col items-center gap-3">
                    <CircularProgress size={36} className="text-blue-600" />
                    <Typography className="text-slate-500 font-medium text-sm">Generating predictive forecast...</Typography>
                </div>
            </Card>
        );
    }

    if (error || !forecast) {
        return (
            <Card className="shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl p-8 min-h-[350px] flex items-center justify-center">
                <div className="flex flex-col items-center text-center max-w-sm">
                    <AlertCircle className="text-orange-500 mb-3" size={36} />
                    <Typography className="font-bold text-slate-800 mb-1">Forecast Unavailable</Typography>
                    <Typography className="text-slate-500 text-sm">{error || "No forecast matches this filter."}</Typography>
                </div>
            </Card>
        );
    }

    // Trend badge styling
    const trendConfig = {
        rising: {
            color: "text-emerald-700 bg-emerald-50 border-emerald-100",
            icon: TrendingUp,
            label: "Rising Trend",
            summaryColor: "bg-emerald-50/80 border-emerald-100"
        },
        falling: {
            color: "text-rose-700 bg-rose-50 border-rose-100",
            icon: TrendingDown,
            label: "Declining Trend",
            summaryColor: "bg-rose-50/80 border-rose-100"
        },
        stable: {
            color: "text-slate-700 bg-slate-50 border-slate-150",
            icon: Minus,
            label: "Stable Trend",
            summaryColor: "bg-slate-50/80 border-slate-150"
        }
    };

    const currentTrend = trendConfig[forecast.trend] || trendConfig.stable;
    const TrendIcon = currentTrend.icon;

    // Helper to format factors impact badges
    const getFactorBadge = (impact, multiplier) => {
        const valueText = `${multiplier > 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`;
        if (impact === 'positive') {
            return <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full">{valueText} Price pressure</span>;
        } else if (impact === 'negative') {
            return <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">{valueText} Price depressor</span>;
        }
        return <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full">Neutral</span>;
    };

    return (
        <Card className="shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl overflow-hidden font-['Outfit']">
            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <Typography className="font-extrabold text-slate-800 text-lg">
                        {cropName} Forecast
                    </Typography>
                    <Typography className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                        {districtName} Region
                    </Typography>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-xs ${currentTrend.color}`}>
                    <TrendIcon size={14} />
                    {currentTrend.label}
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                {/* Plain-English summary banner */}
                <div className={`p-4 rounded-2xl border flex gap-3 items-start ${currentTrend.summaryColor}`}>
                    <div className="p-1.5 rounded-xl bg-white shadow-sm mt-0.5">
                        <AlertCircle className="text-slate-700" size={16} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Analysis Summary</p>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{forecast.summary}</p>
                    </div>
                </div>

                {/* Base price reference */}
                <div className="flex justify-between items-center py-2 px-1 border-b border-slate-100">
                    <div className="text-slate-500 text-sm font-medium">Base Price (7D Moving Avg)</div>
                    <div className="font-extrabold text-slate-800 text-lg">Rs. {forecast.basePrice?.toLocaleString()}</div>
                </div>

                {/* Forecast Timeline Grid */}
                <div>
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Prediction Windows</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Day 10 */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md shadow-slate-100/50 flex flex-col justify-between hover:border-blue-100 transition-colors">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100/50 rounded-md px-1.5 py-0.5 self-start mb-2">10 DAYS</span>
                            <div className="my-1.5">
                                <div className="text-base font-extrabold text-slate-800">
                                    Rs. {forecast.forecast?.day10?.price?.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    Band: {forecast.forecast?.day10?.confidenceLow?.toLocaleString()} - {forecast.forecast?.day10?.confidenceHigh?.toLocaleString()}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">±6% Confidence</span>
                        </div>

                        {/* Day 20 */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md shadow-slate-100/50 flex flex-col justify-between hover:border-blue-100 transition-colors">
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100/50 rounded-md px-1.5 py-0.5 self-start mb-2">20 DAYS</span>
                            <div className="my-1.5">
                                <div className="text-base font-extrabold text-slate-800">
                                    Rs. {forecast.forecast?.day20?.price?.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    Band: {forecast.forecast?.day20?.confidenceLow?.toLocaleString()} - {forecast.forecast?.day20?.confidenceHigh?.toLocaleString()}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">±9% Confidence</span>
                        </div>

                        {/* Day 30 */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md shadow-slate-100/50 flex flex-col justify-between hover:border-blue-100 transition-colors">
                            <span className="text-[10px] font-bold text-violet-500 bg-violet-50 border border-violet-100/50 rounded-md px-1.5 py-0.5 self-start mb-2">30 DAYS</span>
                            <div className="my-1.5">
                                <div className="text-base font-extrabold text-slate-800">
                                    Rs. {forecast.forecast?.day30?.price?.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    Band: {forecast.forecast?.day30?.confidenceLow?.toLocaleString()} - {forecast.forecast?.day30?.confidenceHigh?.toLocaleString()}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">±12% Confidence</span>
                        </div>
                    </div>
                </div>

                {/* Factors/Drivers breakdown */}
                <div>
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Market Drivers Breakdown</h4>
                    <div className="space-y-3">
                        {/* Seasonal */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
                                <Calendar size={16} />
                            </div>
                            <div className="flex-grow space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-800">Seasonal Index</span>
                                    {getFactorBadge(forecast.factors?.seasonal?.impact, forecast.factors?.seasonal?.multiplier)}
                                </div>
                                <p className="text-slate-500 text-xs font-medium">{forecast.factors?.seasonal?.label}</p>
                            </div>
                        </div>

                        {/* Weather */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <div className="p-2 rounded-xl bg-sky-50 text-sky-500">
                                <CloudSun size={16} />
                            </div>
                            <div className="flex-grow space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-800">Weather Risk</span>
                                    {getFactorBadge(forecast.factors?.weather?.impact, forecast.factors?.weather?.multiplier)}
                                </div>
                                <p className="text-slate-500 text-xs font-medium">{forecast.factors?.weather?.label}</p>
                            </div>
                        </div>

                        {/* Supply */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-500">
                                <Package size={16} />
                            </div>
                            <div className="flex-grow space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-800">Supply Balance</span>
                                    {getFactorBadge(forecast.factors?.supply?.impact, forecast.factors?.supply?.multiplier)}
                                </div>
                                <p className="text-slate-500 text-xs font-medium">{forecast.factors?.supply?.label}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PriceForecastCard;

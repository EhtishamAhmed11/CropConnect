import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import LatestPricesTable from '../../components/market/LatestPricesTable';
import PriceTrendChart from '../../components/market/PriceTrendChart';
import { gisAPI } from '../../api/gisApi';
import {
    TrendingUp,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Globe
} from 'lucide-react';

const MarketStatCard = ({ title, value, subtext, icon: Icon, color, trend }) => {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colors[color] || colors.blue}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">{subtext}</p>
            </div>
        </div>
    );
};

const MarketDashboard = () => {
    const [selectedTrend, setSelectedTrend] = useState({
        cropId: null,
        districtId: null,
        cropName: '',
        districtName: ''
    });

    const [districts, setDistricts] = useState([]);
    const [highlights, setHighlights] = useState({
        avgWheatPrice: 0,
        topGainer: { name: "Loading...", gain: 0 },
        volatileCrop: "Loading..."
    });

    useEffect(() => {
        const loadMetaData = async () => {
            try {
                const [distRes, highRes] = await Promise.all([
                    gisAPI.getDistricts({ limit: 100 }),
                    marketAPI.getHighlights()
                ]);
                if (distRes.data.success) setDistricts(distRes.data.data);
                if (highRes.data.success) setHighlights(highRes.data.data);
            } catch (e) { console.error(e); }
        };
        loadMetaData();
    }, []);

    const handleRowClick = (cropId, districtId, cropName, districtName) => {
        setSelectedTrend({
            cropId,
            districtId,
            cropName: cropName || 'Selected Crop',
            districtName: districtName || 'Selected District'
        });
    };

    return (
        <Layout>
            <div className="font-['Outfit'] space-y-8 p-2">

                {/* Hero / Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 shadow-2xl overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity size={120} />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold uppercase tracking-widest text-xs">
                            <Globe size={14} /> Global Market Index
                        </div>
                        <h1 className="text-4xl font-extrabold mb-4">Market Intelligence</h1>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            Real-time commodities tracking, price volatility analysis, and predictive market trends.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MarketStatCard
                        title="Avg Wheat Price"
                        value={`Rs. ${highlights.avgWheatPrice.toLocaleString()}`}
                        subtext="Latest Market Quote"
                        icon={DollarSign}
                        color="emerald"
                        trend={2.4}
                    />
                    <MarketStatCard
                        title="Top Gainer"
                        value={highlights.topGainer.name}
                        subtext="Strong monthly growth"
                        icon={TrendingUp}
                        color="blue"
                        trend={highlights.topGainer.gain}
                    />
                    <MarketStatCard
                        title="Volatile Crop"
                        value={highlights.volatileCrop}
                        subtext="Fluctuating supply levels"
                        icon={Activity}
                        color="orange"
                        trend={-1.2}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Prices Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-500" /> Live Prices
                                </h3>
                                {/* Assuming LatestPricesTable has its own controls, but we wrapper it nicely */}
                            </div>
                            <div className="p-0">
                                <LatestPricesTable onRowClick={handleRowClick} />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Charts & Insights */}
                    <div className="space-y-6">
                        {/* Chart Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-purple-500" /> Price Trends
                            </h3>
                            <div className="min-h-[300px]">
                                <PriceTrendChart
                                    cropId={selectedTrend.cropId}
                                    districtId={selectedTrend.districtId}
                                    cropName={selectedTrend.cropName}
                                />
                            </div>
                        </div>

                        {/* Insights Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Activity size={20} /> Smart Insights
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-emerald-300 text-sm">Wheat Index</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Active</span>
                                    </div>
                                    <p className="text-xs text-indigo-100 leading-relaxed">Current average price at Rs. {highlights.avgWheatPrice.toLocaleString()}. Market shows stability across major districts.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-blue-300 text-sm">{highlights.topGainer.name} Surge</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Bullish</span>
                                    </div>
                                    <p className="text-xs text-indigo-100 leading-relaxed">Strong upward trend detected with a {highlights.topGainer.gain}% gain over the last 7 days.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-orange-300 text-sm">{highlights.volatileCrop} Alert</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Bearish</span>
                                    </div>
                                    <p className="text-xs text-indigo-100 leading-relaxed">High price volatility reported. Traders are advised to monitor supply chain disruptions closely.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MarketDashboard;

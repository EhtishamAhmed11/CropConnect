import React, { useState, useEffect } from "react";
import { productionAPI } from "../../api/productionAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

const ProductionAnalysis = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [filters, setFilters] = useState({ year: "2024-25", crop: "" });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce filter changes
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsSearching(false);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await productionAPI.getSummary(debouncedFilters);
      setSummary(response.data.data);
    } catch (error) {
      showError("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await productionAPI.getTrends(debouncedFilters);
      setTrends(response.data.data);
    } catch (error) {
      showError("Failed to fetch trends");
    }
  };

  // Fetch data when debounced filters change
  useEffect(() => {
    fetchSummary();
    fetchTrends();
  }, [debouncedFilters]);

  const handleClearFilters = () => {
    setFilters({ year: "2024-25", crop: "" });
  };

  if (loading && !summary) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasActiveFilter = filters.crop !== "";

  return (
    <Layout>
      <div className="space-y-8 font-['Outfit']">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-1">Intelligence Module</p>
            <h1 className="text-4xl font-extrabold text-slate-800">
              Production Analysis
            </h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex items-center">
            <input
              type="text"
              placeholder="Filter by Crop (e.g. WHEAT)..."
              value={filters.crop}
              onChange={(e) => setFilters({ ...filters, crop: e.target.value.toUpperCase() })}
              className="border-none bg-transparent focus:ring-0 text-sm font-semibold text-slate-700 px-4 w-64"
            />
            {hasActiveFilter && (
              <button onClick={handleClearFilters} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                ✕
              </button>
            )}
            {isSearching && <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full mr-3"></div>}
          </div>
        </div>

        {/* Summary Cards Grid */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🌾</div>
                <p className="text-slate-500 text-sm font-medium">Total Production</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">
                  {summary.totalProduction ? (summary.totalProduction / 1000000).toFixed(2) : 0}M
                  <span className="text-sm font-normal text-slate-400 ml-1">tons</span>
                </p>
              </div>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📐</div>
                <p className="text-slate-500 text-sm font-medium">Cultivated Area</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">
                  {summary.totalArea ? (summary.totalArea / 1000000).toFixed(2) : 0}M
                  <span className="text-sm font-normal text-slate-400 ml-1">ha</span>
                </p>
              </div>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                <p className="text-slate-500 text-sm font-medium">Average Yield</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">
                  {summary.avgYield.toFixed(2)}
                  <span className="text-sm font-normal text-slate-400 ml-1">t/ha</span>
                </p>
              </div>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📋</div>
                <p className="text-slate-500 text-sm font-medium">Data Points</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">
                  {summary.recordCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {trends.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Primary Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-100 border border-slate-100 col-span-1 lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Historical Performance
                  </h2>
                  <p className="text-slate-500">Year-over-year production volume analysis</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  Trend Analysis
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                    tickFormatter={(value) => `${(value / 1000)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area
                    type="monotone"
                    dataKey="production"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProduction)"
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Secondary Chart: Growth */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-100 border border-slate-100">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Growth Velocity</h2>
                <p className="text-slate-500 text-sm">Percentage change from previous season</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="growthRate" radius={[4, 4, 4, 4]} barSize={40}>
                    {trends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.growthRate >= 0 ? "#10b981" : "#f43f5e"}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table Widget */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden flex flex-col">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Key Metrics</h2>
              </div>
              <div className="overflow-y-auto flex-1 pr-2">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-l-lg">Year</th>
                      <th className="px-4 py-3 text-right">Vol (t)</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trends.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{item.year}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">{item.production.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.growthRate >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {item.growthRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <span className="text-6xl mb-4 block opacity-50">📊</span>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Waiting for Input
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Select key filters above to generate a comprehensive production analysis report.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductionAnalysis;
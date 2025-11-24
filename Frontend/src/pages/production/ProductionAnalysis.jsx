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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Production Analysis
            </h1>
            <p className="text-gray-500 mt-1">
              Comprehensive production insights and trends
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
            {hasActiveFilter && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <Select
              label="Year"
              name="year"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              options={[
                { value: "2024-25", label: "2024-25" },
                { value: "2023-24", label: "2023-24" },
                { value: "2022-23", label: "2022-23" },
              ]}
            /> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Code (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., WHEAT, RICE"
                value={filters.crop}
                onChange={(e) =>
                  setFilters({ ...filters, crop: e.target.value.toUpperCase() })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {isSearching && (
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg
                className="animate-spin h-4 w-4 mr-2 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating analysis...
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12  rounded-lg flex items-center justify-center text-2xl">
                  🌾
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-200 text-emerald-700 rounded-full">
                  Total
                </span>
              </div>
              <p className="text-sm text-emerald-700 font-medium mb-1">
                Total Production
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {summary.totalProduction.toLocaleString()}
              </p>
              <p className="text-sm text-emerald-600 mt-1">tonnes</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12  rounded-lg flex items-center justify-center text-2xl">
                  📐
                </div>
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">
                Total Area
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {summary.totalArea.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-1">hectares</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12  rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
              </div>
              <p className="text-sm text-purple-700 font-medium mb-1">
                Average Yield
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {summary.avgYield.toFixed(2)}
              </p>
              <p className="text-sm text-purple-600 mt-1">tonnes/hectare</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12  rounded-lg flex items-center justify-center text-2xl">
                  📋
                </div>
              </div>
              <p className="text-sm text-orange-700 font-medium mb-1">
                Total Records
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {summary.recordCount}
              </p>
              <p className="text-sm text-orange-600 mt-1">data points</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {trends.length > 0 ? (
          <div className="space-y-6">
            {/* Production Trend - Area Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Production Trend Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient
                      id="colorProduction"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="production"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorProduction)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Growth Rate - Bar Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Growth Rate Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="growthRate" radius={[8, 8, 0, 0]}>
                    {trends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.growthRate >= 0 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Detailed Trend Data
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Crop
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Production
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Growth Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trends.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.crop}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                          {item.production.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${item.growthRate >= 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {item.growthRate >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(item.growthRate)}%
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
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Trend Data Available
            </h3>
            <p className="text-gray-500">
              {loading
                ? "Loading data..."
                : "Select different filters to view production trends"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductionAnalysis;
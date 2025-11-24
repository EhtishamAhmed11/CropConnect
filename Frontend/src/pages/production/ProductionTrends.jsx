import React, { useState, useEffect } from "react";
import { productionAPI } from "../../api/productionAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell
} from "recharts";

const ProductionTrends = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState([]);
  const [filters, setFilters] = useState({
    crop: "",
    level: "national",
  });

  useEffect(() => {
    if (filters.crop) {
      fetchTrends();
    }
  }, [filters]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await productionAPI.getTrends(filters);
      setTrends(response.data.data);
    } catch (error) {
      showError("Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Production Trends
          </h1>
          <p className="text-gray-500 mt-1">
            Analyze production patterns over time
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., WHEAT, RICE"
                value={filters.crop}
                onChange={(e) =>
                  setFilters({ ...filters, crop: e.target.value.toUpperCase() })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <Select
              label="Analysis Level"
              name="level"
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
              options={[
                { value: "national", label: "National" },
                { value: "provincial", label: "Provincial" },
                { value: "district", label: "District" },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : trends.length > 0 ? (
          <div className="space-y-6">
            {/* Multi-line Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Production, Area & Yield Trends
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={trends}>
                  <defs>
                    <linearGradient
                      id="colorProduction"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="production"
                    fill="url(#colorProduction)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="area"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="yield"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Growth Rate Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Year-over-Year Growth Rate
              </h2>
              <ResponsiveContainer width="100%" height={250}>
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
                        Area
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Yield
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Growth Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trends.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.crop}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                          {item.production.toLocaleString()}{" "}
                          <span className="text-gray-500 font-normal">
                            tonnes
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-700">
                          {item.area.toLocaleString()}{" "}
                          <span className="text-gray-500">hectares</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {item.yield}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${
                              item.growthRate >= 0
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
              {filters.crop ? "No Data Available" : "Enter Crop Code"}
            </h3>
            <p className="text-gray-500">
              {filters.crop
                ? "No trend data found for the selected crop"
                : "Please enter a crop code to view production trends"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductionTrends;

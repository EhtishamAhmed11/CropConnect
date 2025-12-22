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
      <div className="space-y-8 font-['Outfit']">

        {/* Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-600 font-bold uppercase tracking-wider text-sm mb-1">Temporal Analysis</p>
            <h1 className="text-4xl font-extrabold text-slate-800">
              Long-term Trends
            </h1>
          </div>
          {/* Simple Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-4">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🌱</span>
              <input
                type="text"
                placeholder="Crop (e.g. RICE)..."
                value={filters.crop}
                onChange={(e) =>
                  setFilters({ ...filters, crop: e.target.value.toUpperCase() })
                }
                className="pl-9 border-none bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 w-48 py-2"
              />
            </div>
            <div className="relative">
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="border-none bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 py-2 pl-3 pr-8"
              >
                <option value="national">National Level</option>
                <option value="provincial">Provincial Level</option>
                <option value="district">District Level</option>
              </select>
            </div>
          </div>
        </div>


        {loading ? (
          <Loading />
        ) : trends.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">

            {/* Main Interactive Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Multi-Metric Evolution</h2>
                  <p className="text-slate-500">Correlation between Area, Yield, and Total Production</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-600">Production</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-slate-600">Area</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-xs font-bold text-slate-600">Yield</span>
                  </div>
                </div>
              </div>

              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorProductionTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                    <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />

                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="production"
                      fill="url(#colorProductionTrend)"
                      stroke="#10b981"
                      strokeWidth={3}
                      activeDot={{ r: 8, strokeWidth: 4, stroke: "#fff" }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="area"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="yield"
                      fill="#8b5cf6"
                      radius={[4, 4, 4, 4]}
                      barSize={20}
                      opacity={0.6}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pivot Table */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-100 border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Values Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-6 py-4 rounded-l-lg">Season</th>
                      <th className="px-6 py-4">Output (t)</th>
                      <th className="px-6 py-4">Land Use (ha)</th>
                      <th className="px-6 py-4">Efficiency (t/ha)</th>
                      <th className="px-6 py-4 rounded-r-lg text-right">YoY Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trends.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{item.year}</td>
                        <td className="px-6 py-4 font-mono text-emerald-600">{item.production.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-blue-600">{item.area.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-purple-600 font-bold">{item.yield}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${item.growthRate >= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-50 text-red-600"
                              }`}
                          >
                            {item.growthRate > 0 ? "+" : ""}{item.growthRate}%
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
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-4">
              📈
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Start Your Analysis
            </h3>
            <p className="text-slate-500 max-w-md text-center">
              Please enter a valid crop code (e.g. <b>WHEAT</b>, <b>RICE</b>) to generate the long-term trend analysis report.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductionTrends;

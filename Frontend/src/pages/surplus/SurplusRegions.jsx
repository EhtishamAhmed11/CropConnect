import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Input from "../../components/common/Input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SurplusRegions = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    year: "2024-25",
    crop: "WHEAT",
    minSurplus: 10,
  });
  const [tempFilters, setTempFilters] = useState({
    year: "2024-25",
    crop: "WHEAT",
    minSurplus: 10,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await surplusDeficitAPI.getSurplusRegions(filters);
      setRegions(response.data.data.surplusRegions);
    } catch (error) {
      showError("Failed to fetch surplus regions");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = { year: "2024-25", crop: "WHEAT", minSurplus: 10 };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const chartData = regions.map((r) => ({
    name: r.region.name,
    available: r.availableForRedistribution,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surplus Regions</h1>
          <p className="text-gray-500 mt-1">
            Regions with excess production available for redistribution
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Year"
              value={tempFilters.year}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, year: e.target.value })
              }
              placeholder="e.g., 2024-25"
            />
            <Input
              label="Crop Code"
              value={tempFilters.crop}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  crop: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g., WHEAT, RICE"
            />
            <Input
              label="Min Surplus %"
              type="number"
              value={tempFilters.minSurplus}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, minSurplus: e.target.value })
              }
              placeholder="Minimum surplus percentage"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {regions.length > 0 ? (
          <>
            {/* Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Available Surplus by Region
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="available" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Regions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {region.region.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {region.crop} • {region.year}
                      </p>
                    </div>
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      SURPLUS
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Surplus %
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {region.surplusPercentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Balance
                      </span>
                      <span className="text-lg font-bold text-emerald-700">
                        {region.balance.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t-2 border-emerald-200 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Production:</span>
                        <span className="font-semibold">
                          {region.production?.toLocaleString() || "N/A"} t
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Consumption:</span>
                        <span className="font-semibold">
                          {region.consumption?.toLocaleString() || "N/A"} t
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-200 rounded-lg border border-emerald-300">
                      <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wide mb-1">
                        Available for Redistribution
                      </p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {region.availableForRedistribution.toLocaleString()}
                      </p>
                      <p className="text-sm text-emerald-700">tonnes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Summary Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-2xl">
                      🏘️
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700 font-medium mb-1">
                    Total Surplus Regions
                  </p>
                  <p className="text-4xl font-bold text-emerald-900">
                    {regions.length}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center text-2xl">
                      📦
                    </div>
                  </div>
                  <p className="text-sm text-teal-700 font-medium mb-1">
                    Total Available
                  </p>
                  <p className="text-4xl font-bold text-teal-900">
                    {regions
                      .reduce(
                        (sum, r) => sum + (r.availableForRedistribution || 0),
                        0
                      )
                      .toLocaleString()}
                  </p>
                  <p className="text-sm text-teal-600">tonnes</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center text-2xl">
                      📊
                    </div>
                  </div>
                  <p className="text-sm text-cyan-700 font-medium mb-1">
                    Avg Surplus %
                  </p>
                  <p className="text-4xl font-bold text-cyan-900">
                    {(
                      regions.reduce((sum, r) => sum + r.surplusPercentage, 0) /
                      regions.length
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-16 border border-gray-200 text-center">
            <div className="text-7xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No Surplus Regions Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters to see results
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SurplusRegions;

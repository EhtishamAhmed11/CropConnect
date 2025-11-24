// ==================== ProductionDetails.jsx ====================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productionAPI } from "../../api/productionAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ProductionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await productionAPI.getById(id);
      setData(response.data.data);
    } catch (error) {
      showError("Failed to fetch production details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await productionAPI.delete(id);
        showSuccess("Production record deleted");
        navigate("/production");
      } catch (error) {
        showError("Failed to delete record");
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🚫</span>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Record Not Found
          </h3>
          <p className="text-gray-500 mb-6">
            The production record you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/production")}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Back to List
          </button>
        </div>
      </Layout>
    );
  }

  // Prepare data for visualizations
  const metricsData = [
    {
      name: "Production",
      value: data.production.value,
      fill: "#10b981",
    },
    {
      name: "Area",
      value: data.areaCultivated.value,
      fill: "#3b82f6",
    },
  ];

  const reliabilityScore =
    {
      high: 95,
      medium: 70,
      low: 40,
    }[data.reliability] || 50;

  const reliabilityData = [
    {
      name: "Reliability",
      value: reliabilityScore,
      fill:
        reliabilityScore > 80
          ? "#10b981"
          : reliabilityScore > 50
          ? "#f59e0b"
          : "#ef4444",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Production Details
            </h1>
            <p className="text-gray-500 mt-1">
              Detailed view of production record
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/production")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📋</span>
                Basic Information
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    Year
                  </p>
                  <p className="text-lg font-bold text-gray-900">{data.year}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    Crop
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.cropName}
                  </p>
                  <p className="text-sm text-gray-600">({data.cropCode})</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    Level
                  </p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {data.level}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    Province
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.province?.name || "N/A"}
                  </p>
                </div>
                {data.district && (
                  <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                      District
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {data.district.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Production Metrics Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📊</span>
                Production Metrics
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-2xl mb-3">
                    🌾
                  </div>
                  <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-1">
                    Production
                  </p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {data.production.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    {data.production.unit}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl mb-3">
                    📐
                  </div>
                  <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-1">
                    Area Cultivated
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {data.areaCultivated.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {data.areaCultivated.unit}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl mb-3">
                    📈
                  </div>
                  <p className="text-xs text-purple-700 font-medium uppercase tracking-wide mb-1">
                    Yield
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {data.yield.value}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {data.yield.unit}
                  </p>
                </div>
              </div>

              {/* Production vs Area Chart */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Production vs Area Comparison
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={metricsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h2 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>📝</span>
                  Notes
                </h2>
                <p className="text-gray-700 leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Data Quality & Source */}
          <div className="space-y-6">
            {/* Data Quality Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>✓</span>
                Data Quality
              </h2>

              <div className="space-y-6">
                {/* Reliability Score */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Reliability Score
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {reliabilityScore}%
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={15}
                      data={reliabilityData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill={reliabilityData[0].fill}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-center">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        data.reliability === "high"
                          ? "bg-emerald-100 text-emerald-700"
                          : data.reliability === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {data.reliability.toUpperCase()} Reliability
                    </span>
                  </div>
                </div>

                {/* Data Source */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                    Data Source
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {data.dataSource}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                      Created
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(data.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(data.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg text-left transition-all">
                  📊 View Regional Comparison
                </button>
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg text-left transition-all">
                  📈 Analyze Trends
                </button>
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg text-left transition-all">
                  📄 Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductionDetails;

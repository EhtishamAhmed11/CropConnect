import React, { useState } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

// Results Display Component
const ResultsCard = ({ result }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "surplus":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "deficit":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-200";
      case "moderate":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "mild":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    return status === "surplus" ? "📈" : status === "deficit" ? "📉" : "📊";
  };

  // Chart data
  const selfSufficiencyData = [
    {
      name: "Self Sufficiency",
      value: result.selfSufficiencyRatio,
      fill:
        result.selfSufficiencyRatio >= 100
          ? "#10b981"
          : result.selfSufficiencyRatio >= 80
          ? "#f59e0b"
          : "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div
        className={`p-6 rounded-xl border-2 ${getStatusColor(result.status)}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75 mb-2">
              Overall Status
            </p>
            <p className="text-3xl font-bold">{result.status.toUpperCase()}</p>
          </div>
          <span className="text-6xl">{getStatusIcon(result.status)}</span>
        </div>
      </div>

      {/* Self-Sufficiency Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Self-Sufficiency Ratio
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={20}
            data={selfSufficiencyData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={selfSufficiencyData[0].fill}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
              fill="#1f2937"
            >
              {result.selfSufficiencyRatio}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-xl">
              ⚖️
            </div>
          </div>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Balance
          </p>
          <p className="text-3xl font-bold text-blue-900">
            {result.balance.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600 mt-1">tonnes</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-xl">
              📊
            </div>
          </div>
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
            Surplus/Deficit %
          </p>
          <p className="text-3xl font-bold text-purple-900">
            {result.surplusDeficitPercentage > 0 ? "+" : ""}
            {result.surplusDeficitPercentage}%
          </p>
        </div>
      </div>

      {/* Severity Badge */}
      {result.severity !== "none" && (
        <div
          className={`p-6 rounded-xl border-2 ${getSeverityColor(
            result.severity
          )}`}
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">⚠️</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-75">
                Severity Level
              </p>
              <p className="text-2xl font-bold">
                {result.severity.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              💡
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-amber-900 mb-3">
                Recommendations
              </p>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-1">•</span>
                    <span className="text-sm text-amber-800 leading-relaxed">
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="text-7xl mb-4">📊</div>
    <h3 className="text-xl font-bold text-gray-700 mb-2">No Results Yet</h3>
    <p className="text-sm text-gray-500 max-w-sm">
      Enter the required parameters and click Calculate to view the
      surplus/deficit analysis.
    </p>
  </div>
);

const Calculate = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    year: "2024-25",
    crop: "",
    province: "",
    district: "",
  });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const yearPattern = /^\d{4}-\d{2}$/;

    if (!yearPattern.test(formData.year)) {
      newErrors.year = "Year must be in format YYYY-YY (e.g., 2024-25)";
    }
    if (!formData.crop.trim()) {
      newErrors.crop = "Crop code is required";
    } else if (formData.crop.length < 2) {
      newErrors.crop = "Crop code must be at least 2 characters";
    }
    if (formData.province && formData.province.length < 2) {
      newErrors.province = "Province code must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleClear = () => {
    setFormData({ year: "2024-25", crop: "", province: "", district: "" });
    setResult(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Please fix the validation errors");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await surplusDeficitAPI.calculate(formData);
      setResult(response.data.data);
      showSuccess("Calculation completed successfully");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to calculate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Surplus/Deficit Calculator
          </h1>
          <p className="text-gray-500 mt-1">
            Calculate crop surplus or deficit based on production and
            consumption data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>⚙️</span>
                Input Parameters
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Input
                  label="Year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="YYYY-YY (e.g., 2024-25)"
                  required
                />
                {errors.year && (
                  <p className="text-red-600 text-xs mt-1">{errors.year}</p>
                )}
              </div>

              <div>
                <Input
                  label="Crop Code"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  placeholder="e.g., WHEAT, RICE"
                  required
                />
                {errors.crop && (
                  <p className="text-red-600 text-xs mt-1">{errors.crop}</p>
                )}
              </div>

              <div>
                <Input
                  label="Province Code"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="e.g., PB, SD, KP"
                />
                {errors.province && (
                  <p className="text-red-600 text-xs mt-1">{errors.province}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Optional: Leave blank for national level
                </p>
              </div>

              <div>
                <Input
                  label="District Code"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g., LHR, KHI, ISB"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Optional: Requires province code
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmit} fullWidth loading={loading}>
                  {loading ? "Calculating..." : "Calculate"}
                </Button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📊</span>
                Analysis Results
              </h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mb-4"></div>
                  <p className="text-gray-700 font-semibold">Calculating...</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Analyzing crop data
                  </p>
                </div>
              ) : result ? (
                <ResultsCard result={result} />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calculate;

import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Button from "../../components/common/Button";
import {
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

// Results Display Component
const ResultsCard = ({ result }) => {
  const isSurplus = result.status === "surplus";
  const statusColor = isSurplus ? "text-emerald-700" : "text-red-700";
  const bgColor = isSurplus ? "bg-emerald-50" : "bg-red-50";
  const borderColor = isSurplus ? "border-emerald-200" : "border-red-200";

  const selfSufficiencyData = [
    {
      name: "Self Sufficiency",
      value: result.selfSufficiencyRatio > 100 ? 100 : result.selfSufficiencyRatio,
      fill: result.selfSufficiencyRatio >= 100 ? "#10b981" : result.selfSufficiencyRatio >= 80 ? "#f59e0b" : "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Status Card */}
      <div className={`p-8 rounded-xl border ${borderColor} ${bgColor}`}>
        <h2 className={`text-4xl font-bold ${statusColor} mb-2`}>
          {result.status.toUpperCase()}
        </h2>
        <p className="text-slate-700 text-lg">
          {isSurplus
            ? 'Production exceeds local consumption requirements.'
            : 'Local consumption exceeds available production.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Self Sufficiency Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide mb-4">Self-Sufficiency Ratio</h3>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="100%"
                barSize={15}
                data={selfSufficiencyData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar background dataKey="value" cornerRadius={30} fill={selfSufficiencyData[0].fill} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
              <span className="text-4xl font-bold text-slate-800">{result.selfSufficiencyRatio}%</span>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 gap-4">
          {/* Balance */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Net Balance</p>
              <p className="text-2xl font-bold text-slate-800">
                {result.balance.toLocaleString()} <span className="text-sm font-normal text-slate-500">tons</span>
              </p>
            </div>
          </div>

          {/* Severity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${result.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Impact Level</p>
              <p className={`text-2xl font-bold capitalize ${result.severity === 'critical' ? 'text-red-600' : 'text-slate-700'}`}>
                {result.severity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production vs Consumption Comparison */}
      {(result.production || result.consumption) && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide mb-4">Production vs Demand</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Production', value: result.production || 0 },
                  { name: 'Demand', value: result.consumption || 0 },
                ]}
                layout="vertical"
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  formatter={(value) => `${value.toLocaleString()} tonnes`}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-slate-800 text-white rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-indigo-400" /> Recommendations
          </h3>
          <ul className="space-y-4">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </span>
                <p className="text-slate-300 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Calculate = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metadata, setMetadata] = useState({ years: [], crops: [], provinces: [], districts: [] });
  const [formData, setFormData] = useState({
    year: "",
    crop: "",
    province: "",
    district: "",
  });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const res = await surplusDeficitAPI.getMetadata();
      if (res.data.success) {
        const d = res.data.data;
        setMetadata(d);
        if (d.years.length > 0) setFormData(prev => ({ ...prev, year: d.years[0] }));
      }
    } catch (err) {
      showError("Failed to load filter metadata");
    } finally {
      setMetaLoading(false);
    }
  };

  const filteredDistricts = formData.province
    ? metadata.districts.filter(d => d.province === formData.province)
    : metadata.districts;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.year) newErrors.year = "Required";
    if (!formData.crop) newErrors.crop = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "province") updated.district = ""; // Reset district on province change
      return updated;
    });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleClear = () => {
    setFormData({ year: metadata.years[0] || "", crop: "", province: "", district: "" });
    setResult(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return showError("Please select required parameters");

    setLoading(true);
    setResult(null);
    try {
      const response = await surplusDeficitAPI.calculate(formData);
      setResult(response.data.data);
      showSuccess("Analysis generated successfully");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to process analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

        {/* Simple Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Resource Calculator</h1>
          <p className="text-slate-600 mt-2">
            Calculate surplus or deficit based on production and consumption data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">
                Configuration
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fiscal Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    {metadata.years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crop Type</label>
                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border ${errors.crop ? 'border-red-500' : 'border-slate-300'} rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all`}
                  >
                    <option value="">Select Crop...</option>
                    {metadata.crops.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.crop && <p className="text-red-500 text-xs mt-1">{errors.crop}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2">Region Filter</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Province (Optional)</label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="">All Provinces (National)</option>
                        {metadata.provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${!formData.province ? 'text-slate-400' : 'text-slate-700'} mb-1`}>District (Optional)</label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.province}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${!formData.province ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">All Districts (Provincial)</option>
                        {filteredDistricts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <Button
                    onClick={handleSubmit}
                    fullWidth
                    loading={loading}
                    className="py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    {loading ? "Calculating..." : "Run Analysis"}
                  </Button>
                  <button
                    onClick={handleClear}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium py-2"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Processing data...</p>
              </div>
            ) : result ? (
              <ResultsCard result={result} />
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center p-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-100 mb-4">📊</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 max-w-sm">
                  Select parameters from the configuration panel to generate a new surplus/deficit report.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calculate;

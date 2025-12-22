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
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50 font-['Outfit'] rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-6 opacity-80">🚫</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Record Not Found</h3>
          <p className="text-slate-500 mb-8 max-w-md text-center">The production record you requested likely does not exist or has been removed.</p>
          <button
            onClick={() => navigate("/production")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
          >
            Return to Database
          </button>
        </div>
      </Layout>
    );
  }

  const reliabilityScore = { high: 95, medium: 70, low: 40 }[data.reliability] || 50;

  const getReliabilityColor = (score) => {
    if (score >= 80) return "#10b981"; // Emerald
    if (score >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <Layout>
      <div className="space-y-8 font-['Outfit']">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-10 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="text-9xl">📝</span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => navigate("/production")} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white">
                  ← Back
                </button>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  {data.year} season
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                {data.cropName} Production
              </h1>
              <div className="flex items-center gap-4 text-slate-300 text-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {data.province?.name || "Unknown Province"}
                </span>
                {data.district && (
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                    {data.district.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl font-bold transition-all flex items-center gap-2 group"
              >
                <span className="group-hover:scale-110 transition-transform">🗑️</span> Delete Record
              </button>
              <button className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                <span>✏️</span> Edit
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Key Metrics */}
          <div className="lg:col-span-2 space-y-8">

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Production Card */}
              <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-100 border border-emerald-100 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">Total Output</p>
                <div className="flex items-baseline gap-1 relative z-10">
                  <span className="text-3xl font-extrabold text-slate-800">{data.production.value.toLocaleString()}</span>
                  <span className="text-sm text-slate-400 font-medium">tons</span>
                </div>
              </div>

              {/* Area Card */}
              <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-100 border border-blue-100 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">Land Usage</p>
                <div className="flex items-baseline gap-1 relative z-10">
                  <span className="text-3xl font-extrabold text-slate-800">{data.areaCultivated.value.toLocaleString()}</span>
                  <span className="text-sm text-slate-400 font-medium">ha</span>
                </div>
              </div>

              {/* Yield Card */}
              <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-100 border border-purple-100 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <p className="text-purple-600 font-bold text-xs uppercase tracking-wider mb-2">Efficiency</p>
                <div className="flex items-baseline gap-1 relative z-10">
                  <span className="text-3xl font-extrabold text-slate-800">{data.yield.value}</span>
                  <span className="text-sm text-slate-400 font-medium">t/ha</span>
                </div>
              </div>
            </div>

            {/* Detailed Info Panel */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">📋</span>
                Specification Data
              </h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Crop Variety Code</p>
                  <p className="text-lg font-semibold text-slate-800 font-mono">{data.cropCode}</p>
                </div>
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Reporting Level</p>
                  <p className="text-lg font-semibold text-slate-800 capitalize">{data.level}</p>
                </div>
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Data Source</p>
                  <p className="text-lg font-semibold text-slate-800">{data.dataSource}</p>
                </div>
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Record ID</p>
                  <p className="text-sm font-mono text-slate-500 break-all">{id}</p>
                </div>
              </div>
            </div>

            {data.notes && (
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                  <span>📝</span> Field Notes
                </h3>
                <p className="text-amber-900/80 leading-relaxed font-medium">
                  {data.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Col: Reliability & Analysis */}
          <div className="space-y-6">

            {/* Data Quality Widget */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-emerald-50 border border-emerald-100 text-center">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Data Reliability</h2>
              <div className="relative w-40 h-40 mx-auto mb-4">
                {/* Simple CSS Ring Chart fallback if Recharts is overkill or buggy in mini-view */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={getReliabilityColor(reliabilityScore)}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * reliabilityScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-800">{reliabilityScore}%</span>
                </div>
              </div>
              <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${data.reliability === 'high' ? 'bg-emerald-100 text-emerald-700' :
                  data.reliability === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                }`}>
                {data.reliability.toUpperCase()} Confidence
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Audit Trail</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Created At</span>
                  <span className="font-mono text-slate-700">{new Date(data.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-mono text-slate-700">{new Date(data.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default ProductionDetails;

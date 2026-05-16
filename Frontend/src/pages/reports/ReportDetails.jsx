import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import {
  FileText, Download, Calendar, FileType, CheckCircle, AlertCircle,
  Clock, ArrowLeft, Share2, Lightbulb, AlertTriangle, Target, Info,
  BarChart3, MapPin, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";

// ── Insight Card ──────────────────────────────────────────────────────────────
const InsightCard = ({ insight }) => {
  const typeStyles = {
    highlight: { bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600", icon: Target },
    warning: { bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600", icon: AlertTriangle },
    danger: { bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-600", icon: AlertTriangle },
    info: { bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-600", icon: Info },
    action: { bg: "bg-purple-50", border: "border-purple-200", iconColor: "text-purple-600", icon: Lightbulb },
  };
  const style = typeStyles[insight.type] || typeStyles.info;
  const IconComp = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-2xl p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${style.iconColor}`}>
          <IconComp size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm mb-1">{insight.icon} {insight.title}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{insight.text}</p>
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

// ── Charts Components ─────────────────────────────────────────────────────────
const ProductionCharts = ({ chartData }) => {
  if (!chartData) return null;
  return (
    <div className="space-y-6">
      {chartData.productionByProvince?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Production by Province</h3>
          <p className="text-xs text-slate-400 mb-4">Total crop production output per province (in tonnes)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.productionByProvince}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} tonnes`, 'Production']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="production" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {chartData.yieldComparison?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Yield Efficiency Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Crop yield in tonnes per hectare</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.yieldComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(value) => [`${value} t/ha`, 'Yield']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="yield" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const SurplusDeficitCharts = ({ chartData }) => {
  if (!chartData) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartData.statusBreakdown?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Status Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Surplus vs deficit vs balanced regions</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.statusBreakdown.filter(s => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.statusBreakdown.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {chartData.severityBreakdown?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Severity Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">How serious are the deficit regions?</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.severityBreakdown.filter(s => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.severityBreakdown.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      {chartData.balanceByProvince?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Surplus vs Deficit by Province</h3>
          <p className="text-xs text-slate-400 mb-4">Green = surplus, Red = deficit (tonnes)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.balanceByProvince}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="surplus" fill="#10b981" name="Surplus" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="deficit" fill="#ef4444" name="Deficit" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {chartData.topDeficits?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Most Critical Deficit Zones</h3>
          <p className="text-xs text-slate-400 mb-4">Districts with the largest food shortages</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.topDeficits} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} tonnes`, 'Deficit']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="deficit" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportDetails({ report }) {
  const { showError } = useAlert();
  const [downloading, setDownloading] = useState(false);

  if (!report) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Report Data</h2>
            <p className="text-gray-600 mb-6">The requested report could not be found.</p>
            <button onClick={() => window.history.back()} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-5 h-5" /> Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Normalize the report data (handle both direct and nested response)
  const reportData = report?.data || report;
  const insights = reportData?.insights || [];
  const chartData = reportData?.chartData || null;
  const summary = reportData?.summary || null;
  const isProduction = reportData?.reportType === "production_analysis";
  const isSurplus = reportData?.reportType === "surplus_deficit";

  const handleDownload = async () => {
    if (!reportData?._id) return;
    setDownloading(true);
    try {
      const res = await reportAPI.downloadReport(reportData._id);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportData.fileName || `report.${reportData.format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: { bg: "bg-emerald-500", lightBg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: CheckCircle, label: "Completed" },
      generating: { bg: "bg-blue-500", lightBg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Clock, label: "Generating" },
      pending: { bg: "bg-yellow-500", lightBg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: Clock, label: "Pending" },
      failed: { bg: "bg-red-500", lightBg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertCircle, label: "Failed" },
    };
    return configs[reportData.status?.toLowerCase()] || configs.pending;
  };

  const statusConfig = getStatusConfig(reportData.status);
  const StatusIcon = statusConfig.icon;
  const formatDate = (ds) => new Date(ds).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const getFormatIcon = (f) => ({ pdf: "📄", excel: "📊", csv: "📋" }[f?.toLowerCase()] || "📄");

  // Build stats cards from persisted summary
  const stats = isProduction && summary ? [
    { label: "Total Records", value: summary.totalRecords?.toLocaleString() || "0", icon: BarChart3, color: "bg-blue-500" },
    { label: "Total Production", value: `${Math.round(summary.totalProduction || 0).toLocaleString()} tons`, icon: TrendingUp, color: "bg-emerald-500" },
    { label: "Area Cultivated", value: `${Math.round(summary.totalArea || 0).toLocaleString()} ha`, icon: MapPin, color: "bg-purple-500" },
  ] : isSurplus && summary ? [
    { label: "Total Regions", value: summary.totalRegions?.toLocaleString() || "0", icon: MapPin, color: "bg-blue-500" },
    { label: "Surplus Regions", value: summary.surplusRegions?.toLocaleString() || "0", icon: TrendingUp, color: "bg-emerald-500" },
    { label: "Deficit Regions", value: summary.deficitRegions?.toLocaleString() || "0", icon: BarChart3, color: "bg-red-500" },
    { label: "Critical Deficits", value: summary.criticalDeficits?.toLocaleString() || "0", icon: FileText, color: "bg-orange-500" },
  ] : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Back Button */}
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Reports
        </button>

        {/* Header Card */}
        <div className={`${statusConfig.lightBg} ${statusConfig.border} border-2 rounded-2xl shadow-xl overflow-hidden`}>
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={`${statusConfig.bg} rounded-xl p-4 shadow-lg`}>
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{reportData.title}</h1>
                  <p className="text-gray-700 text-base mb-4">{reportData.description || "No description available"}</p>
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusConfig.bg} text-white shadow-md`}>
                      <StatusIcon className="w-4 h-4" /> {statusConfig.label.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md">
                      {getFormatIcon(reportData.format)} {reportData.format?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              {reportData.status === "completed" && (
                <div className="flex flex-col gap-3">
                  <button onClick={handleDownload} disabled={downloading} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {downloading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                    {downloading ? "Downloading..." : "Download Report"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className={`grid grid-cols-2 ${stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        )}

        {/* Charts */}
        {isProduction && chartData && <ProductionCharts chartData={chartData} />}
        {isSurplus && chartData && <SurplusDeficitCharts chartData={chartData} />}

        {/* Decision Support & Insights */}
        {insights.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Decision Support & Insights</h3>
                <p className="text-xs text-slate-500">Actionable recommendations based on the data analysis</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
            </div>
          </div>
        )}

        {/* Report Metadata */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
            <h2 className="text-xl font-bold text-white">Report Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-2">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><FileType className="w-5 h-5 text-blue-600" /> File Details</h3>
                <div className="flex justify-between"><span className="text-sm text-gray-600">Format:</span><span className="text-sm font-bold uppercase">{reportData.format}</span></div>
                {reportData.fileSize && <div className="flex justify-between"><span className="text-sm text-gray-600">Size:</span><span className="text-sm font-bold">{(reportData.fileSize / 1024).toFixed(1)} KB</span></div>}
                <div className="flex justify-between"><span className="text-sm text-gray-600">Report ID:</span><span className="text-sm font-bold font-mono">{reportData.reportId || reportData._id}</span></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-2">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Timestamps</h3>
                <div className="flex justify-between"><span className="text-sm text-gray-600">Created:</span><span className="text-sm font-bold">{formatDate(reportData.createdAt)}</span></div>
                {reportData.generatedAt && <div className="flex justify-between"><span className="text-sm text-gray-600">Completed:</span><span className="text-sm font-bold">{formatDate(reportData.generatedAt)}</span></div>}
              </div>
              {reportData.parameters && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-2">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><FileType className="w-5 h-5 text-emerald-600" /> Parameters</h3>
                  {Object.entries(reportData.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between"><span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span><span className="text-sm font-bold">{Array.isArray(value) ? value.join(', ') || '—' : value || '—'}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
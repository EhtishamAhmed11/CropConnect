import React, { useState } from "react";
import { Link } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import {
  FileText, TrendingUp, ArrowRight, Settings, CheckCircle,
  Download, BarChart3, MapPin, Wheat, Table2, ExternalLink,
  ChevronDown, ChevronUp, FileBarChart
} from "lucide-react";

// ── Report Type Card ──────────────────────────────────────────────────────────
const ReportTypeCard = ({ type, title, description, icon: Icon, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${isSelected
        ? "border-blue-500 bg-blue-50/60 shadow-xl shadow-blue-500/10"
        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"
      }`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-4 transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"
      }`}>
      <Icon size={28} />
    </div>
    <h3 className={`font-bold text-lg mb-2 ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
      {title}
    </h3>
    <p className={`text-sm leading-relaxed ${isSelected ? "text-blue-700" : "text-slate-500"}`}>
      {description}
    </p>
    {isSelected && (
      <div className="absolute top-4 right-4 text-blue-500">
        <CheckCircle size={24} className="fill-current" />
      </div>
    )}
  </button>
);

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

// ── Data Preview Table ────────────────────────────────────────────────────────
const DataPreviewTable = ({ data, reportType }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data : data.slice(0, 8);

  if (!data || data.length === 0) return null;

  const isProduction = reportType === "production_analysis";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-slate-500" />
          <span className="font-bold text-slate-700">Data Preview</span>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
            {data.length} records
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Crop</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">District</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Province</th>
              {isProduction ? (
                <>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Production</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Area</th>
                </>
              ) : (
                <>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance (tons)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{item.cropType?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.district?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.province?.name || "—"}</td>
                {isProduction ? (
                  <>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {item.production?.value?.toLocaleString()} {item.production?.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.areaCultivated?.value?.toLocaleString()} {item.areaCultivated?.unit}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${item.status === "surplus"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${item.balance >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}>
                      {item.balance >= 0 ? "+" : ""}{item.balance?.toLocaleString()}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 8 && (
        <div className="border-t border-slate-100 px-6 py-3 flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors"
          >
            {expanded ? (
              <><ChevronUp size={16} /> Show less</>
            ) : (
              <><ChevronDown size={16} /> Show all {data.length} records</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Report Preview Panel ──────────────────────────────────────────────────────
const ReportPreview = ({ reportType, result, onDownload, downloading }) => {
  const { report, data = [], summary } = result;

  const isProduction = reportType === "production_analysis";
  const isSurplus = reportType === "surplus_deficit";

  const stats = isProduction
    ? [
      { label: "Total Records", value: summary?.totalRecords?.toLocaleString() || data.length.toLocaleString(), icon: BarChart3, color: "bg-blue-500" },
      { label: "Total Production", value: `${Math.round(summary?.totalProduction || 0).toLocaleString()} tons`, icon: TrendingUp, color: "bg-emerald-500" },
      { label: "Area Cultivated", value: `${Math.round(summary?.totalArea || 0).toLocaleString()} ha`, icon: MapPin, color: "bg-purple-500" },
    ]
    : [
      { label: "Total Regions", value: summary?.totalRegions?.toLocaleString() || data.length.toLocaleString(), icon: MapPin, color: "bg-blue-500" },
      { label: "Surplus Regions", value: summary?.surplusRegions?.toLocaleString() || "0", icon: TrendingUp, color: "bg-emerald-500" },
      { label: "Deficit Regions", value: summary?.deficitRegions?.toLocaleString() || "0", icon: BarChart3, color: "bg-red-500" },
      { label: "Critical Deficits", value: summary?.criticalDeficits?.toLocaleString() || "0", icon: FileText, color: "bg-orange-500" },
    ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Preview Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={18} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Report Generated Successfully</h3>
          <p className="text-sm text-slate-500">
            {report?.title} &nbsp;·&nbsp; {report?.format?.toUpperCase()} &nbsp;·&nbsp;
            {new Date(report?.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={`grid grid-cols-2 ${stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Data Table Preview */}
      <DataPreviewTable data={data} reportType={reportType} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60"
        >
          {downloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {downloading ? "Downloading..." : `Download ${report?.format?.toUpperCase()}`}
        </button>

        <Link
          to="/reports"
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink size={18} />
          View All Reports
        </Link>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const GenerateReport = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportType, setReportType] = useState("production_analysis");
  const [generatedResult, setGeneratedResult] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    format: "pdf",
    year: "2024-25",
    crops: "",
    provinces: "",
    emailRecipients: "",
    isScheduled: false,
    scheduleFrequency: "none",
  });

  const reportTypes = [
    {
      type: "production_analysis",
      title: "Production Analysis",
      description: "Comprehensive yield and output metrics across regions.",
      icon: TrendingUp,
    },
    {
      type: "surplus_deficit",
      title: "Surplus & Deficit",
      description: "Critical analysis of regional food security status.",
      icon: FileBarChart,
    },
    {
      type: "custom",
      title: "Custom Report",
      description: "Generate bespoke reports with specific parameters.",
      icon: Settings,
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  // When report type changes, clear previous result
  const handleTypeChange = (type) => {
    setReportType(type);
    setGeneratedResult(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedResult(null);
    try {
      let response;
      const crops = formData.crops ? formData.crops.split(",").map((c) => c.trim()) : [];
      const provinces = formData.provinces ? formData.provinces.split(",").map((p) => p.trim()) : [];
      const emailRecipients = formData.emailRecipients ? formData.emailRecipients.split(",").map((e) => e.trim()) : [];

      if (reportType === "production_analysis") {
        response = await reportAPI.generateProductionAnalysis({ year: formData.year, crops, provinces, format: formData.format });
      } else if (reportType === "surplus_deficit") {
        response = await reportAPI.generateSurplusDeficit({ year: formData.year, crops, format: formData.format });
      } else {
        response = await reportAPI.generate({
          title: formData.title || `Custom Report - ${formData.year}`,
          description: formData.description || "Custom generated report",
          reportType: "custom",
          parameters: { year: formData.year, crops, provinces },
          format: formData.format,
          emailRecipients,
          isScheduled: formData.isScheduled,
          scheduleFrequency: formData.scheduleFrequency,
        });
      }

      showSuccess("Report generated! Preview is ready below.");
      setGeneratedResult(response.data?.data || response.data);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to generate report";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedResult?.report?._id) return;
    setDownloading(true);
    try {
      const res = await reportAPI.downloadReport(generatedResult.report._id);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generatedResult.report.fileName || `report.${formData.format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-extrabold text-slate-800">Generate Report</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Create detailed insights from platform data. Select a template, configure parameters, and preview results instantly.
          </p>
        </div>

        {/* Step 1: Type Selection */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="text-base font-bold text-slate-700">Choose Report Type</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reportTypes.map((type) => (
              <ReportTypeCard
                key={type.type}
                {...type}
                isSelected={reportType === type.type}
                onClick={() => handleTypeChange(type.type)}
              />
            ))}
          </div>
        </div>

        {/* Step 2: Configuration */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-xl font-bold text-slate-800">Configure Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-5">
              {reportType === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Report Title</label>
                  <input
                    name="title" value={formData.title} onChange={handleChange}
                    placeholder="e.g. Q3 Performance Summary"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Data Year</label>
                  <input
                    name="year" value={formData.year} onChange={handleChange}
                    placeholder="2024-25"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Format</label>
                  <select
                    name="format" value={formData.format} onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV Data</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Filter Crops <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  name="crops" value={formData.crops} onChange={handleChange}
                  placeholder="e.g. Wheat, Rice"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
                <p className="text-xs text-slate-400">Comma-separated values</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {reportType === "production_analysis" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Provinces <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    name="provinces" value={formData.provinces} onChange={handleChange}
                    placeholder="e.g. Punjab, Sindh"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              )}

              {reportType === "custom" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email Recipients</label>
                    <input
                      name="emailRecipients" value={formData.emailRecipients} onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox" name="isScheduled" checked={formData.isScheduled} onChange={handleChange}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-700">Schedule Recurring</span>
                    </label>
                    {formData.isScheduled && (
                      <select
                        name="scheduleFrequency" value={formData.scheduleFrequency} onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-slate-200"
                      >
                        <option value="none">Select Frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
              {loading ? "Generating..." : "Generate & Preview"}
            </button>
          </div>
        </div>

        {/* Step 3: Preview (shown after generation) */}
        {generatedResult && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-xl font-bold text-slate-800">Report Preview</h3>
            </div>
            <ReportPreview
              reportType={reportType}
              result={generatedResult}
              onDownload={handleDownload}
              downloading={downloading}
            />
          </div>
        )}

      </div>
    </Layout>
  );
};

export default GenerateReport;

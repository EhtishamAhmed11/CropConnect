import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import {
  FileText,
  TrendingUp,
  ArrowRight,
  Settings,
  Calendar,
  CheckCircle,
  Download
} from "lucide-react";

const ReportTypeCard = ({ type, title, description, icon: Icon, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${isSelected
        ? "border-blue-500 bg-blue-50/50 shadow-xl shadow-blue-500/10"
        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"
      }`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-4 transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'}`}>
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

const GenerateReport = () => {
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("production_analysis");

  // Form data
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
      icon: FileText,
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
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let response;
      const crops = formData.crops ? formData.crops.split(",").map((c) => c.trim()) : [];
      const provinces = formData.provinces ? formData.provinces.split(",").map((p) => p.trim()) : [];
      const emailRecipients = formData.emailRecipients ? formData.emailRecipients.split(",").map((e) => e.trim()) : [];

      if (reportType === "production_analysis") {
        response = await reportAPI.generateProductionAnalysis({
          year: formData.year,
          crops,
          provinces,
          format: formData.format,
        });
      } else if (reportType === "surplus_deficit") {
        response = await reportAPI.generateSurplusDeficit({
          year: formData.year,
          crops,
          format: formData.format,
        });
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

      showSuccess("Report generated successfully!");
      // Optionally navigate to details or list
      navigate("/reports");

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to generate report";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-extrabold text-slate-800">Generate Report</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Create detailed insights from platform data. Select a template below to get started.
          </p>
        </div>

        {/* Step 1: Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportTypes.map((type) => (
            <ReportTypeCard
              key={type.type}
              {...type}
              isSelected={reportType === type.type}
              onClick={() => setReportType(type.type)}
            />
          ))}
        </div>

        {/* Step 2: Configuration */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="text-xl font-bold text-slate-800">Configure Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              {reportType === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Report Title</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Q3 Performance Summary"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Data Year</label>
                  <input
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2024-25"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Format</label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV Data</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Filter Crops (Optional)</label>
                <input
                  name="crops"
                  value={formData.crops}
                  onChange={handleChange}
                  placeholder="e.g. Wheat, Rice"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
                <p className="text-xs text-slate-400">Comma separated values</p>
              </div>
            </div>

            {/* Advanced Info */}
            <div className="space-y-6">
              {reportType === "production_analysis" && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Provinces (Optional)</label>
                  <input
                    name="provinces"
                    value={formData.provinces}
                    onChange={handleChange}
                    placeholder="e.g. Punjab, Sindh"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              )}

              {reportType === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Recipients</label>
                    <input
                      name="emailRecipients"
                      value={formData.emailRecipients}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isScheduled"
                        checked={formData.isScheduled}
                        onChange={handleChange}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-700">Schedule Recurring</span>
                    </label>

                    {formData.isScheduled && (
                      <select
                        name="scheduleFrequency"
                        value={formData.scheduleFrequency}
                        onChange={handleChange}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Download size={20} />
              )}
              {loading ? "Processing..." : "Generate Report"}
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default GenerateReport;

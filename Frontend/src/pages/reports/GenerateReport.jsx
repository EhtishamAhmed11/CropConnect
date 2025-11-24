import React, { useState } from "react";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

// Report Type Card Component
const ReportTypeCard = ({
  type,
  title,
  description,
  icon,
  isSelected,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
      isSelected
        ? "border-blue-600 bg-blue-50 shadow-md"
        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow"
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <h3
          className={`font-semibold mb-1 ${
            isSelected ? "text-blue-900" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm ${
            isSelected ? "text-blue-700" : "text-gray-600"
          }`}
        >
          {description}
        </p>
      </div>
      {isSelected && <span className="text-blue-600 text-xl">✓</span>}
    </div>
  </button>
);

// Generated Report Card Component
const GeneratedReportCard = ({ report, onDownload, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-800 border-green-200",
      generating: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold border ${
          styles[status] || styles.pending
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
          <p className="text-sm text-gray-600">{report.description}</p>
        </div>
        {getStatusBadge(report.status)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-gray-500 text-xs">Report ID</p>
          <p className="font-mono text-gray-900">{report.reportId}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Format</p>
          <p className="font-semibold text-gray-900">
            {report.format.toUpperCase()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Generated</p>
          <p className="text-gray-900">
            {formatDate(report.generatedAt || report.createdAt)}
          </p>
        </div>
        {report.fileSize && (
          <div>
            <p className="text-gray-500 text-xs">Size</p>
            <p className="text-gray-900">{formatFileSize(report.fileSize)}</p>
          </div>
        )}
      </div>

      {report.status === "completed" && (
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(report)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            📥 Download
          </button>
          <button
            onClick={() => onDelete(report._id)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

const GenerateReport = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("production_analysis");
  const [generatedReports, setGeneratedReports] = useState([]);

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
      description:
        "Comprehensive analysis of crop production data across regions",
      icon: "📊",
    },
    {
      type: "surplus_deficit",
      title: "Surplus/Deficit Report",
      description:
        "Regional surplus and deficit analysis for crop distribution",
      icon: "📈",
    },
    {
      type: "custom",
      title: "Custom Report",
      description: "Generate a custom report with specific parameters",
      icon: "⚙️",
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
      const crops = formData.crops
        ? formData.crops.split(",").map((c) => c.trim())
        : [];
      const provinces = formData.provinces
        ? formData.provinces.split(",").map((p) => p.trim())
        : [];
      const emailRecipients = formData.emailRecipients
        ? formData.emailRecipients.split(",").map((e) => e.trim())
        : [];

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
        // Custom report
        response = await reportAPI.generate({
          title: formData.title || `Custom Report - ${formData.year}`,
          description: formData.description || "Custom generated report",
          reportType: "custom",
          parameters: {
            year: formData.year,
            crops,
            provinces,
          },
          format: formData.format,
          emailRecipients,
          isScheduled: formData.isScheduled,
          scheduleFrequency: formData.scheduleFrequency,
        });
      }

      const newReport = response.data.data.report || response.data.data;
      setGeneratedReports([newReport, ...generatedReports]);
      showSuccess("Report generated successfully!");

      // Reset form
      setFormData({
        ...formData,
        title: "",
        description: "",
        crops: "",
        provinces: "",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate report";
      showError(errorMessage);
      console.error("Report generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Method 1: Using Fetch API with Blob (Recommended for binary files)
  const handleDownload = async (report) => {
    if (!report.fileUrl) {
      showError("Report file not available");
      return;
    }

    try {
      showSuccess("Preparing download...");

      // Fetch the file as a blob
      const response = await fetch(report.fileUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // If auth is needed
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName || `${report.reportId}.${report.format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);

      showSuccess("Download completed!");
    } catch (error) {
      console.error("Download error:", error);
      showError("Failed to download report");
    }
  };

  // Method 2: Simple window.open (Fallback)
  const handleDownloadSimple = (report) => {
    if (!report.fileUrl) {
      showError("Report file not available");
      return;
    }

    // This works if backend sets proper Content-Disposition headers
    window.open(report.fileUrl, "_blank");
    showSuccess("Opening report...");
  };

  // Method 3: Using API endpoint (if you create a download endpoint)
  const handleDownloadViaAPI = async (report) => {
    try {
      showSuccess("Preparing download...");

      const response = await reportAPI.download(report._id); // You'd need to add this to your API

      // Assuming the API returns blob data
      const blob = new Blob([response.data], {
        type:
          report.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName || `${report.reportId}.${report.format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
      showSuccess("Download completed!");
    } catch (error) {
      showError("Failed to download report");
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      await reportAPI.delete(reportId);
      setGeneratedReports(generatedReports.filter((r) => r._id !== reportId));
      showSuccess("Report deleted successfully");
    } catch (error) {
      showError("Failed to delete report");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Reports
          </h1>
          <p className="text-gray-600">
            Create comprehensive reports for production analysis,
            surplus/deficit tracking, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Report Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Selection */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                Select Report Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {reportTypes.map((type) => (
                  <ReportTypeCard
                    key={type.type}
                    {...type}
                    isSelected={reportType === type.type}
                    onClick={() => setReportType(type.type)}
                  />
                ))}
              </div>
            </div>

            {/* Report Parameters */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>⚙️</span>
                  Report Parameters
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {reportType === "custom" && (
                  <>
                    <Input
                      label="Report Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Q4 Production Summary"
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Brief description of the report..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="e.g., 2024-25"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format
                    </label>
                    <select
                      name="format"
                      value={formData.format}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Crops (comma-separated)"
                  name="crops"
                  value={formData.crops}
                  onChange={handleChange}
                  placeholder="e.g., WHEAT, RICE, MAIZE"
                />

                {reportType === "production_analysis" && (
                  <Input
                    label="Provinces (comma-separated)"
                    name="provinces"
                    value={formData.provinces}
                    onChange={handleChange}
                    placeholder="e.g., PB, SD, KP"
                  />
                )}

                {reportType === "custom" && (
                  <>
                    <Input
                      label="Email Recipients (comma-separated)"
                      name="emailRecipients"
                      value={formData.emailRecipients}
                      onChange={handleChange}
                      placeholder="e.g., user1@example.com, user2@example.com"
                    />

                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        name="isScheduled"
                        checked={formData.isScheduled}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Schedule recurring report generation
                      </label>
                    </div>

                    {formData.isScheduled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Schedule Frequency
                        </label>
                        <select
                          name="scheduleFrequency"
                          value={formData.scheduleFrequency}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="none">None</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                <Button onClick={handleGenerate} fullWidth loading={loading}>
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Generated Reports */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 sticky top-6">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>📄</span>
                  Generated Reports
                </h2>
              </div>

              <div className="p-6">
                {generatedReports.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {generatedReports.map((report) => (
                      <GeneratedReportCard
                        key={report._id || report.reportId}
                        report={report}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📭</span>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Reports Yet
                    </h3>
                    <p className="text-sm text-gray-500">
                      Generated reports will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateReport;

import { FileText, Download, Calendar, FileType, CheckCircle, AlertCircle, Clock, ArrowLeft, Share2 } from "lucide-react";

export default function ReportDetails({ report }) {
  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Report Data</h2>
          <p className="text-gray-600 mb-6">
            The requested report could not be found or loaded.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        bg: "bg-emerald-500",
        lightBg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        icon: CheckCircle,
        label: "Completed",
      },
      generating: {
        bg: "bg-blue-500",
        lightBg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: Clock,
        label: "Generating",
      },
      pending: {
        bg: "bg-yellow-500",
        lightBg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: Clock,
        label: "Pending",
      },
      failed: {
        bg: "bg-red-500",
        lightBg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: AlertCircle,
        label: "Failed",
      },
    };
    return configs[report.status?.toLowerCase()] || configs.pending;
  };

  const statusConfig = getStatusConfig(report.status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFormatIcon = (format) => {
    const icons = {
      pdf: "📄",
      excel: "📊",
      csv: "📋",
    };
    return icons[format?.toLowerCase()] || "📄";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Reports
        </button>

        {/* Header Card */}
        <div className={`${statusConfig.lightBg} ${statusConfig.border} border-2 rounded-2xl shadow-xl overflow-hidden mb-6`}>
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={`${statusConfig.bg} rounded-xl p-4 shadow-lg`}>
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                    {report.title}
                  </h1>
                  <p className="text-gray-700 text-lg mb-4">
                    {report.description || "No description available"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusConfig.bg} text-white shadow-md`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md">
                      {getFormatIcon(report.format)}
                      {report.format?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {report.status === "completed" && report.fileUrl && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.open(report.fileUrl, "_blank")}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </button>
                  <button
                    onClick={() => alert("Share functionality")}
                    className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Report ID */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                <FileType className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                Report ID
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {report.reportId || report._id || "N/A"}
            </p>
          </div>

          {/* Report Type */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                Report Type
              </h3>
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {report.reportType?.replace(/_/g, ' ') || "Standard"}
            </p>
          </div>

          {/* Created Date */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                Created At
              </h3>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(report.createdAt)}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
            <h2 className="text-2xl font-bold text-white">Additional Information</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Details */}
              {report.fileUrl && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    File Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Format:</span>
                      <span className="text-sm font-bold text-gray-900 uppercase">
                        {report.format}
                      </span>
                    </div>
                    {report.fileSize && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Size:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-bold ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Parameters */}
              {report.parameters && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileType className="w-5 h-5 text-blue-600" />
                    Parameters
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generation Info */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Generation Info
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {report.generatedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {report.createdBy && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Created By:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {report.createdBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Description
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report.description || "No description provided for this report."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section - Only if completed */}
        {report.status === "completed" && report.fileUrl && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block mb-4">
              <Download className="w-16 h-16 text-white mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Your Report is Ready!
            </h2>
            <p className="text-emerald-100 mb-6">
              Click below to download your generated report
            </p>
            <button
              onClick={() => window.open(report.fileUrl, "_blank")}
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all inline-flex items-center gap-3"
            >
              <Download className="w-6 h-6" />
              Download {report.format?.toUpperCase()} Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
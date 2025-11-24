import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const AlertList = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlerts();
  }, [page, filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== "all") params.severity = filter;

      const response = await alertAPI.getAll(params);
      setAlerts(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      showError("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      showSuccess("Alert acknowledged");
      fetchAlerts();
    } catch (error) {
      showError("Failed to acknowledge alert");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      default:
        return "⚪";
    }
  };

  // Stats calculation
  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
  };

  const severityData = [
    { name: "Critical", value: stats.critical, color: "#ef4444" },
    { name: "High", value: alerts.filter((a) => a.severity === "high").length, color: "#f59e0b" },
    { name: "Medium", value: alerts.filter((a) => a.severity === "medium").length, color: "#eab308" },
    { name: "Low", value: alerts.filter((a) => a.severity === "low").length, color: "#3b82f6" },
  ];

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header with Create Alert Button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-500 mt-1">Monitor and manage system alerts</p>
          </div>
          <button
            onClick={() => navigate("/alerts/create")}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium"
          >
            + Create Alert
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📋</span>
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                TOTAL
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Alerts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">⚡</span>
              <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                ACTIVE
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Alerts</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🔴</span>
              <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                CRITICAL
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">✓</span>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                DONE
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Acknowledged</p>
            <p className="text-3xl font-bold text-blue-600">{stats.acknowledged}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Severity Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {severityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Alerts by Severity</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter by Severity:</span>
            {["all", "critical", "high", "medium", "low"].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilter(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === severity
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {severity === "all" ? "All" : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div key={alert._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${alert.status === "active"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {alert.alertType}</span>
                        <span>•</span>
                        <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {alert.status === "active" && (
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlertList;

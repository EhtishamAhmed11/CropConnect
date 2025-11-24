import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";

const DistributorDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        alertAPI.getActive({ limit: 10 }),
        alertAPI.getSummary(),
      ]);

      setAlerts(alertsRes.data.data);
      setAlertsSummary(summaryRes.data.data);
    } catch (error) {
      showError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  return (
    <Layout>
      <div className="space-y-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Distributor Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview and key distributor actions</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/alerts")}
            className="w-full p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-800 font-medium"
          >
            📢 View All Alerts
          </button>

          <button
            onClick={() => navigate("/surplus-deficit/surplus-regions")}
            className="w-full p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-800 font-medium"
          >
            📦 Surplus Regions
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-800 font-medium"
          >
            👤 My Profile
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm">Total Alerts</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {alertsSummary?.totalAlerts || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm">Active Alerts</div>
            <div className="text-3xl font-bold text-orange-600 mt-1">
              {alertsSummary?.activeAlerts || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm">Unacknowledged</div>
            <div className="text-3xl font-bold text-red-600 mt-1">
              {alertsSummary?.unacknowledgedAlerts || 0}
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Active Alerts</h2>

          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${alert.severity === "critical"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : alert.severity === "high"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active alerts</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DistributorDashboard;

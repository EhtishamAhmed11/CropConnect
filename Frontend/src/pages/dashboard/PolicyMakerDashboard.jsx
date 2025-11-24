import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productionAPI } from "../../api/productionAPI";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";

const PolicyMakerDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [deficitSummary, setDeficitSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, deficitRes, alertsRes] = await Promise.all([
        productionAPI.getSummary({ year: "2024-25" }),
        surplusDeficitAPI.getSummary({ year: "2024-25" }),
        alertAPI.getSummary(),
      ]);
      setSummary(prodRes.data.data);
      setDeficitSummary(deficitRes.data.data);
      setAlertsSummary(alertsRes.data.data);
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
      <div>
        <h1 className="text-2xl font-bold mb-6">Policy Maker Dashboard</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Button onClick={() => navigate("/production/analysis")}>
            Production Analysis
          </Button>
          <Button onClick={() => navigate("/surplus-deficit/calculate")}>
            Calculate Deficit
          </Button>
          <Button onClick={() => navigate("/surplus-deficit/deficit-regions")}>
            Deficit Regions
          </Button>
          <Button onClick={() => navigate("/reports/generate")}>
            Generate Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 text-sm">Total Production</p>
            <p className="text-3xl font-bold">
              {summary?.totalProduction
                ? (summary.totalProduction / 1000000).toFixed(2)
                : 0}
              M
            </p>
            <p className="text-xs text-gray-500 mt-1">tonnes</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 text-sm">Avg Yield</p>
            <p className="text-3xl font-bold">
              {summary?.avgYield?.toFixed(2) || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">tonnes/hectare</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 text-sm">Deficit Regions</p>
            <p className="text-3xl font-bold text-red-600">
              {deficitSummary?.statusBreakdown?.deficit || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Critical: {deficitSummary?.severityBreakdown?.critical || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 text-sm">Active Alerts</p>
            <p className="text-3xl font-bold text-orange-600">
              {alertsSummary?.activeAlerts || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Unread: {alertsSummary?.unacknowledgedAlerts || 0}
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Surplus/Deficit Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-600">Surplus Regions</span>
                <span className="font-bold text-green-600">
                  {deficitSummary?.statusBreakdown?.surplus || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Balanced Regions</span>
                <span className="font-bold">
                  {deficitSummary?.statusBreakdown?.balanced || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">Deficit Regions</span>
                <span className="font-bold text-red-600">
                  {deficitSummary?.statusBreakdown?.deficit || 0}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Requires Intervention</p>
              <p className="text-2xl font-bold text-orange-600">
                {deficitSummary?.requiresIntervention || 0}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Alerts Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Total Alerts</span>
                <span className="font-bold">
                  {alertsSummary?.totalAlerts || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">Critical</span>
                <span className="font-bold text-red-600">
                  {alertsSummary?.criticalAlerts || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600">Active</span>
                <span className="font-bold text-orange-600">
                  {alertsSummary?.activeAlerts || 0}
                </span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/alerts")}
              fullWidth
              className="mt-4"
            >
              View All Alerts
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PolicyMakerDashboard;

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { surplusDeficitAPI } from "../../api/surplusDeficitAPI.js";
import { alertsAPI } from "../../api/alertAPI.js";

import StatCard from "../../components/dashboard/StatCard";
import DashboardSection from "../../components/dashboard/DashboardSection";

const DashboardPage = () => {
  const { user, loading } = useAuth(); // get user from context
  const [summary, setSummary] = useState({
    production: { total: 0 },
    surplusDeficit: { surplus: 0, deficit: 0, balanced: 0, critical: 0 },
    alerts: { total: 0, active: 0, critical: 0, unread: 0 },
  });

  const fetchData = async () => {
    try {
      // Surplus/Deficit Summary
      const sdRes = await surplusDeficitAPI.getSummary();
      // Alerts Summary
      const alertsRes = await alertsAPI.getSummary();
      // Production summary placeholder
      const productionSummary = { total: 123456 }; // replace with actual API call

      setSummary({
        production: productionSummary,
        surplusDeficit: {
          ...sdRes.data.data.statusBreakdown,
          critical: sdRes.data.data.severityBreakdown.critical,
        },
        alerts: {
          total: alertsRes.data.data.totalAlerts,
          active: alertsRes.data.data.activeAlerts,
          critical: alertsRes.data.data.criticalAlerts,
          unread: alertsRes.data.data.unacknowledgedAlerts,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>; // wait until user is loaded
  if (!user) return <div>User not found</div>; // safety check

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

      {/* Production */}
      <DashboardSection title="Production">
        <StatCard title="Total Production" value={summary.production.total} />
      </DashboardSection>

      {/* Surplus / Deficit */}
      <DashboardSection title="Surplus / Deficit">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Surplus Regions"
            value={summary.surplusDeficit.surplus}
            color="bg-green-200"
          />
          <StatCard
            title="Deficit Regions"
            value={summary.surplusDeficit.deficit}
            color="bg-red-200"
          />
          <StatCard
            title="Critical Deficits"
            value={summary.surplusDeficit.critical}
            color="bg-red-400"
          />
        </div>
      </DashboardSection>

      {/* Alerts */}
      <DashboardSection title="Alerts">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Alerts"
            value={summary.alerts.total}
            color="bg-gray-200"
          />
          <StatCard
            title="Active Alerts"
            value={summary.alerts.active}
            color="bg-yellow-200"
          />
          <StatCard
            title="Critical Alerts"
            value={summary.alerts.critical}
            color="bg-red-400"
          />
          <StatCard
            title="Unread Alerts"
            value={summary.alerts.unread}
            color="bg-blue-200"
          />
        </div>
      </DashboardSection>

      {/* Role-based Actions */}
      <DashboardSection title="Quick Actions">
        <div className="flex flex-wrap gap-4">
          {user.role === "admin" && (
            <>
              <button className="btn btn-primary">
                Calculate Surplus/Deficit
              </button>
              <button className="btn btn-secondary">Create Alert</button>
            </>
          )}
          {user.role === "government_policy_maker" && (
            <>
              <button className="btn btn-primary">
                Calculate Surplus/Deficit
              </button>
              <button className="btn btn-secondary">Acknowledge Alerts</button>
            </>
          )}
          {user.role === "ngo_coordinator" && (
            <>
              <button className="btn btn-primary">
                View Redistribution Suggestions
              </button>
            </>
          )}
        </div>
      </DashboardSection>
    </div>
  );
};

export default DashboardPage;

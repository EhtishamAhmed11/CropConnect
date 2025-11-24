import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";

const NGODashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [deficitRegions, setDeficitRegions] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deficitRes, alertsRes] = await Promise.all([
        surplusDeficitAPI.getDeficitRegions({
          year: "2024-25",
          severity: "critical",
        }),
        alertAPI.getCritical({ limit: 5 }),
      ]);
      setDeficitRegions(deficitRes.data.data.deficitRegions.critical || []);
      setCriticalAlerts(alertsRes.data.data);
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
        <h1 className="text-2xl font-bold mb-6">NGO Coordinator Dashboard</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Button onClick={() => navigate("/surplus-deficit/deficit-regions")}>
            View Deficit Regions
          </Button>
          <Button onClick={() => navigate("/surplus-deficit/redistribution")}>
            Redistribution Plan
          </Button>
          <Button onClick={() => navigate("/alerts")}>View Alerts</Button>
        </div>

        {/* Critical Deficit Regions */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-red-600">
              Critical Deficit Regions
            </h2>
            <span className="text-2xl font-bold">{deficitRegions.length}</span>
          </div>
          {deficitRegions.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {deficitRegions.slice(0, 6).map((region, index) => (
                <div
                  key={index}
                  className="border border-red-200 rounded p-4 bg-red-50"
                >
                  <h3 className="font-semibold">{region.region.name}</h3>
                  <p className="text-sm text-gray-600">{region.crop}</p>
                  <p className="text-red-600 font-bold mt-2">
                    Deficit: {region.deficitPercentage}%
                  </p>
                  <p className="text-sm">
                    Balance: {region.balance.toLocaleString()} tonnes
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No critical deficit regions</p>
          )}
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Critical Alerts</h2>
          {criticalAlerts.length > 0 ? (
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="border-l-4 border-red-500 pl-4 py-2"
                >
                  <h3 className="font-semibold">{alert.title}</h3>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No critical alerts</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NGODashboard;

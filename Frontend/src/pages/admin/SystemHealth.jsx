import React, { useState, useEffect } from "react";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";

const SystemHealth = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, logsRes] = await Promise.all([
        adminAPI.getSystemHealth(),
        adminAPI.getIngestionLogs({ limit: 10 }),
      ]);
      setHealth(healthRes.data.data);
      setLogs(logsRes.data.data);
    } catch (error) {
      showError("Failed to fetch system health");
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">System Health</h1>
          <Button onClick={fetchData}>Refresh</Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">System Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Overall Status</p>
                <p
                  className={`text-2xl font-bold ${
                    health?.status === "healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {health?.status?.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="font-semibold">{health?.database?.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="font-semibold">
                  {Math.floor(health?.system?.uptime / 3600)} hours{" "}
                  {Math.floor((health?.system?.uptime % 3600) / 60)} minutes
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Memory Usage</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">RSS</p>
                <p className="font-semibold">{health?.system?.memory?.rss}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Heap Total</p>
                <p className="font-semibold">
                  {health?.system?.memory?.heapTotal}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Heap Used</p>
                <p className="font-semibold">
                  {health?.system?.memory?.heapUsed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Ingestion Status */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Data Ingestion</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Failed (Last 24h)</p>
                <p className="text-2xl font-bold text-red-600">
                  {health?.dataIngestion?.failedLast24h || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Reports</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-orange-600">
                  {health?.reports?.pending || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ingestion Logs */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Recent Data Ingestion Logs</h2>
          {logs.length > 0 ? (
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Source</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Records Processed</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b">
                    <td className="py-2">{log.sourceType}</td>
                    <td className="py-2">{log.dataType}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : log.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="text-right py-2">{log.recordsProcessed}</td>
                    <td className="py-2">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No recent logs</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SystemHealth;

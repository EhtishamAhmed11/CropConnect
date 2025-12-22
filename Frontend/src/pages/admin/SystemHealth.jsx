import React, { useState, useEffect } from "react";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";
import { Activity, Server, Database, AlertCircle, RefreshCw, Cpu, HardDrive } from "lucide-react";

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

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy": return "text-emerald-500 bg-emerald-50 border-emerald-100";
      case "degraded": return "text-amber-500 bg-amber-50 border-amber-100";
      case "critical": return "text-red-500 bg-red-50 border-red-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  // Helper to format uptime
  const formatUptime = (seconds) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Helper to format bytes
  const formatMemory = (bytes) => {
    if (!bytes) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`; // Convert to MB roughly
  };

  if (loading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-blue-500 font-bold uppercase tracking-wider text-sm mb-1">System Diagnostics</p>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-slate-800">Platform Health</h1>
              <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-xs font-bold uppercase ${getStatusColor(health?.status || 'unknown')}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {health?.status || 'UNKNOWN'}
              </div>
            </div>
          </div>

          <Button onClick={fetchData} className="shadow-lg shadow-blue-200">
            <RefreshCw size={18} className="mr-2" />
            Refresh Status
          </Button>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Database */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-5 p-4 transform group-hover:scale-110 transition-transform">
              <Database size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Database Cluster</p>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{health?.database?.status || 'N/A'}</h3>
              <p className="text-emerald-500 text-xs font-bold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Connected
              </p>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl border border-indigo-400 shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 p-4">
              <Server size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-indigo-100 text-xs font-bold uppercase mb-2">System Uptime</p>
              <h3 className="text-3xl font-extrabold mb-1 font-mono tracking-tighter">
                {formatUptime(health?.system?.uptime)}
              </h3>
              <p className="text-indigo-100 text-xs opacity-80">Since last restart</p>
            </div>
          </div>

          {/* Warnings / Failed Ingestions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-5 p-4 text-red-500">
              <AlertCircle size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Failed Ingestions (24h)</p>
              <h3 className={`text-3xl font-extrabold mb-1 ${health?.dataIngestion?.failedLast24h > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                {health?.dataIngestion?.failedLast24h || 0}
              </h3>
              <p className="text-slate-400 text-xs">Error rate: Low</p>
            </div>
          </div>

          {/* Memory RSS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 p-4 text-blue-500">
              <Cpu size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Memory Usage (RSS)</p>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {health?.system?.memory?.rss}
              </h3>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full w-1/3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Logs Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              Recent Activity Logs
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase bg-white px-3 py-1 rounded-lg border border-slate-100">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            {logs.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Type</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Processed</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-700">{log.sourceType}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{log.dataType}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${log.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            log.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' ? 'bg-emerald-500' :
                              log.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                            }`}></span>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-sm text-slate-600">{log.recordsProcessed}</td>
                      <td className="py-4 px-6 text-right text-sm text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-medium">No activity logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SystemHealth;

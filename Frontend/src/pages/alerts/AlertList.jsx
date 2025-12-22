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
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Filter,
  Plus,
  Search,
  Clock,
  ShieldAlert,
  DollarSign
} from "lucide-react";

// Stat Card
const StatCard = ({ title, value, icon: Icon, color }) => {
  const theme = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-red-600 bg-red-50 border-red-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    gray: "text-slate-600 bg-slate-50 border-slate-100",
  }
  const t = theme[color] || theme.gray;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-lg flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

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

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-2">Alert Center</h1>
            <p className="text-slate-400">Real-time system notifications and emergency broadcasts.</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => navigate("/alerts/price")}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/20 flex items-center gap-2"
            >
              <DollarSign size={20} /> Price Alerts
            </button>
            <button
              onClick={() => navigate("/alerts/create")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
            >
              <Plus size={20} /> Broadcast Alert
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Alerts" value={stats.total} icon={Bell} color="gray" />
          <StatCard title="Active Issues" value={stats.active} icon={AlertTriangle} color="orange" />
          <StatCard title="Critical" value={stats.critical} icon={ShieldAlert} color="red" />
          <StatCard title="Resolved" value={stats.acknowledged} icon={CheckCircle} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Filters & Analytics */}
          <div className="lg:col-span-1 space-y-8">

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Filter size={18} className="text-slate-400" /> Filter Feed
              </h3>
              <div className="flex flex-wrap gap-2">
                {["all", "critical", "high", "medium", "low"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilter(sev)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${filter === sev
                      ? "bg-slate-800 text-white border-slate-800 shadow-md"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="font-bold text-slate-800 mb-6">Severity Distribution</h3>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-700">{stats.total}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {severityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    {item.name} ({item.value})
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Col: Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Alert Feed</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 w-48"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert._id} className="p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex gap-4">
                          <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {alert.severity === 'critical' ? <ShieldAlert size={20} /> : <Bell size={20} />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${alert.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                alert.severity === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                {alert.severity}
                              </span>
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {new Date(alert.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{alert.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{alert.message}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {alert.status === 'active' ? (
                            <button
                              onClick={() => handleAcknowledge(alert._id)}
                              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                              <CheckCircle size={12} /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Bell className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="font-medium">No alerts found matching this filter.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AlertList;

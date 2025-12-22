import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI } from "../../api/adminAPI";
import { gisAPI } from "../../api/gisApi";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import WeatherWidget from "../../components/weather/WeatherWidget";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Map as MapIcon,
  FileText,
  Thermometer,
  ShieldCheck,
  Package
} from "lucide-react";

// Stat Card Component (Premium)
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  loading
}) => {
  const getColors = (c) => {
    const maps = {
      blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", gradient: "from-blue-500 to-blue-600" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", gradient: "from-emerald-500 to-emerald-600" },
      amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", gradient: "from-amber-500 to-amber-600" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", gradient: "from-indigo-500 to-indigo-600" },
      rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", gradient: "from-rose-500 to-rose-600" },
    };
    return maps[c] || maps.blue;
  };

  const colors = getColors(color);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200 transaction-all duration-300 relative overflow-hidden group">
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
            <Icon size={24} />
          </div>
          {trend && (
            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>

        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div> : value}
        </h3>
        {subtitle && <p className="text-slate-400 text-xs mt-2 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newThisMonth: 0 },
    system: { status: 'healthy', uptime: 0 },
    content: { reports: 0, alerts: 0 }
  });

  const [chartData, setChartData] = useState([
    { name: 'Jan', active: 400, new: 240 },
    { name: 'Feb', active: 300, new: 139 },
    { name: 'Mar', active: 200, new: 980 },
    { name: 'Apr', active: 278, new: 390 },
    { name: 'May', active: 189, new: 480 },
    { name: 'Jun', active: 239, new: 380 },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();

      if (response.data.success) {
        const d = response.data.data;
        setStats({
          users: {
            total: d.users.total,
            active: d.users.active,
            newThisMonth: d.activity ? d.activity[d.activity.length - 1].new : 0
          },
          system: { status: 'healthy', uptime: 99.9 }, // Uptime remains heuristic
          content: {
            reports: d.reports.total,
            alerts: d.alerts.active
          }
        });

        if (d.activity) {
          setChartData(d.activity);
        }
      }
    } catch (error) {
      console.error(error);
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* Dashboard Hero */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 w-full">
            <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">{currentDate}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
              Welcome back, {user?.username || 'Admin'}
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Here's what's happening on the platform today. System performance is optimal.
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            icon={Users}
            color="indigo"
            trend={12}
            loading={loading}
          />
          <StatCard
            title="Active Alerts"
            value={stats.content.alerts}
            icon={AlertTriangle}
            color="rose"
            subtitle="Critical requires attention"
            loading={loading}
          />
          <StatCard
            title="System Status"
            value={stats.system.status === 'healthy' ? 'Optimal' : 'Degraded'}
            icon={Activity}
            color="emerald"
            subtitle={`Uptime: ${stats.system.uptime}%`}
            loading={loading}
          />
          <StatCard
            title="Reports Generated"
            value={stats.content.reports}
            icon={FileText}
            color="blue"
            trend={5}
            loading={loading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Charts */}
          <div className="lg:col-span-8 space-y-8">
            {/* Activity Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-blue-500" />
                  Platform Activity
                </h3>
                <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-500 uppercase px-3 py-1 cursor-pointer hover:bg-slate-100">
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={() => navigate('/admin/user-management')} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all duration-300">
                <div className="mb-4 text-indigo-500 group-hover:scale-110 transition-transform origin-left">
                  <Users size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">Manage Users</h4>
                <p className="text-xs text-slate-500 mb-4">Add, remove, or update user permissions.</p>
                <div className="flex items-center text-indigo-600 text-xs font-extrabold uppercase tracking-wide">
                  Manage <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div onClick={() => navigate('/admin/system-health')} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer transition-all duration-300">
                <div className="mb-4 text-emerald-500 group-hover:scale-110 transition-transform origin-left">
                  <Activity size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">System Health</h4>
                <p className="text-xs text-slate-500 mb-4">Monitor database and API status.</p>
                <div className="flex items-center text-emerald-600 text-xs font-extrabold uppercase tracking-wide">
                  View Logs <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div onClick={() => navigate('/reports')} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer transition-all duration-300">
                <div className="mb-4 text-blue-500 group-hover:scale-110 transition-transform origin-left">
                  <FileText size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">Reports</h4>
                <p className="text-xs text-slate-500 mb-4">View and generate platform reports.</p>
                <div className="flex items-center text-blue-600 text-xs font-extrabold uppercase tracking-wide">
                  View Reports <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weather & Alerts */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Thermometer className="text-orange-500" />
                Live Weather
              </h3>
              <WeatherWidget />
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={100} />
              </div>
              <h3 className="text-lg font-bold mb-4 relative z-10">Admin Shortcuts</h3>
              <ul className="space-y-4 relative z-10">
                <li>
                  <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <span className="font-medium text-sm">Role Definitions</span>
                  </Link>
                </li>
                <li>
                  <Link to="/logs" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
                      <Activity size={16} />
                    </div>
                    <span className="font-medium text-sm">Audit Logs</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

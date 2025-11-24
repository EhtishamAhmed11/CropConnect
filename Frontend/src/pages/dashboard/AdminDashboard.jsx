import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "emerald",
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        {/* Clean icon container (NO gradient) */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl text-gray-700">
          {icon}
        </div>

        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon, label, onClick, color = "emerald" }) => {
  const colorClasses = {
    emerald: "hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700",
    blue: "hover:bg-blue-50 hover:border-blue-300 text-blue-700",
    purple: "hover:bg-purple-50 hover:border-purple-300 text-purple-700",
    orange: "hover:bg-orange-50 hover:border-orange-300 text-orange-700",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-100 rounded-xl transition-all duration-300 ${colorClasses[color]} hover:shadow-md`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

// Progress Bar Component
const ProgressBar = ({ percentage, color = "emerald" }) => {
  const colorClasses = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ data, total }) => {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
  let currentAngle = 0;

  const createSlice = (value, color, index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const radius = 40;
    const cx = 50;
    const cy = 50;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((currentAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return (
      <path
        key={index}
        d={pathData}
        fill={color}
        className="transition-all duration-300 hover:opacity-80"
      />
    );
  };

  return (
    <svg viewBox="0 0 100 100" className="w-48 h-48">
      {data.map((item, index) =>
        createSlice(item.value, colors[index % colors.length], index)
      )}
      <circle cx="50" cy="50" r="25" fill="white" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-lg font-bold"
        fill="#1f2937"
      >
        {total}
      </text>
      <text
        x="50"
        y="60"
        textAnchor="middle"
        className="text-xs"
        fill="#6b7280"
      >
        Total
      </text>
    </svg>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getSystemHealth(),
      ]);

      setStats(statsRes.data.data);
      setSystemHealth(healthRes.data.data);
    } catch (error) {
      showError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const userRoleData = Object.entries(stats?.users?.byRole || {}).map(
    ([role, value]) => ({
      role: role.replace(/_/g, " "),
      value,
    })
  );

  const totalUsers = userRoleData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor and manage your system
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon="👥"
            label="Manage Users"
            onClick={() => navigate("/admin/user-management")}
            color="emerald"
          />

          <QuickActionButton
            icon="🔔"
            label="View Alerts"
            onClick={() => navigate("/alerts")}
            color="orange"
          />

          <QuickActionButton
            icon="📊"
            label="Reports"
            onClick={() => navigate("/reports")}
            color="purple"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            subtitle={`${stats?.users?.active || 0} active users`}
            icon="👥"
            trend={12}
          />

          <StatCard
            title="Production Records"
            value={(stats?.production?.totalRecords || 0).toLocaleString()}
            subtitle="All time records"
            icon="📈"
            trend={8}
            color="blue"
          />

          <StatCard
            title="Active Alerts"
            value={stats?.alerts?.active || 0}
            subtitle={`${stats?.alerts?.critical || 0} critical alerts`}
            icon="⚠️"
            color="orange"
          />

          <StatCard
            title="Total Reports"
            value={stats?.reports?.total || 0}
            subtitle="Generated reports"
            icon="📄"
            trend={5}
            color="purple"
          />
        </div>

        {/* Charts & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users By Role */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Users by Role
            </h2>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DonutChart data={userRoleData} total={totalUsers} />
              </div>

              <div className="flex-1 space-y-3">
                {userRoleData.map((item, index) => {
                  const colors = [
                    "bg-emerald-500",
                    "bg-blue-500",
                    "bg-orange-500",
                    "bg-red-500",
                    "bg-purple-500",
                  ];

                  const percentage = (
                    (item.value / totalUsers) *
                    100
                  ).toFixed(1);

                  return (
                    <div key={item.role} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${colors[index % colors.length]
                          }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item.role}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {item.value}
                          </span>
                        </div>
                        <ProgressBar
                          percentage={percentage}
                          color={colors[index % colors.length]
                            .replace("bg-", "")
                            .replace("-500", "")}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              System Health
            </h2>

            <div className="space-y-4">
              {/* Overall Status */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                      System Status
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {systemHealth?.status === "healthy"
                        ? "Healthy"
                        : "Issues Detected"}
                    </p>
                  </div>

                  <div className="w-16 h-16 rounded-full  flex items-center justify-center text-3xl">
                    {systemHealth?.status === "healthy" ? "✓" : "⚠"}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Database
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {systemHealth?.database?.status || "Connected"}
                  </p>
                  <div className="mt-2">
                    <ProgressBar percentage={95} color="emerald" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Memory
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {systemHealth?.system?.memory?.heapUsed || "N/A"}
                  </p>
                  <div className="mt-2">
                    <ProgressBar percentage={67} color="blue" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Uptime
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.floor((systemHealth?.system?.uptime || 0) / 3600)}h
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Running smoothly
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    API Response
                  </p>
                  <p className="text-lg font-bold text-gray-900">42ms</p>
                  <p className="text-xs text-emerald-600 mt-1">Excellent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Reports
              </h2>

              <button
                onClick={() => navigate("/reports")}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                View all →
              </button>
            </div>
          </div>

          {stats?.reports?.recent && stats.reports.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {stats.reports.recent.map((report) => {
                    const statusColors = {
                      completed: "bg-emerald-100 text-emerald-700",
                      pending: "bg-yellow-100 text-yellow-700",
                      failed: "bg-red-100 text-red-700",
                    };

                    return (
                      <tr
                        key={report._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">
                            {report.title}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600 capitalize">
                            {report.reportType.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status] ||
                              statusColors.pending
                              }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(report.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-500">No recent reports available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

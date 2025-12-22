import { Link } from "react-router-dom";
import { ShieldCheck, Users, ArrowRight, Activity, Globe, Database } from "lucide-react";
import Layout from "../../components/layout/Layout"; // Assuming Layout is used in parent, but good to have if needed for structure

export default function AdminOverview() {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="font-['Outfit'] space-y-8 p-6">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2">{currentDate}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
              Command Center
            </h1>
            <p className="text-slate-400 max-w-xl text-lg">
              Centralized administration for system monitoring, user access control, and platform configurations.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-bold">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* System Health Module */}
        <Link
          to="/admin/system-health"
          className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-500">
            <Activity />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <ShieldCheck size={32} />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">System Diagnostics</h2>
            <p className="text-slate-500 mb-8 line-clamp-2">
              Real-time monitoring of backend services, database latency, ingestion logs, and API health status.
            </p>

            <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
              <span>Open Monitor</span>
              <ArrowRight size={20} className="ml-2" />
            </div>
          </div>
        </Link>

        {/* User Management Module */}
        <Link
          to="/admin/user-management"
          className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-500">
            <Users />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <Users size={32} />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">User & Access Control</h2>
            <p className="text-slate-500 mb-8 line-clamp-2">
              Manage platform users, role-based permissions (RBAC), and account security settings.
            </p>

            <div className="flex items-center text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
              <span>Manage Users</span>
              <ArrowRight size={20} className="ml-2" />
            </div>
          </div>
        </Link>

      </div>

      {/* Quick Stats / Footer Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Environment</p>
            <p className="text-slate-700 font-bold">Production (v1.0.2)</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Database</p>
            <p className="text-slate-700 font-bold">MongoDB Cluster</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Security</p>
            <p className="text-slate-700 font-bold">Standard Protocols</p>
          </div>
        </div>
      </div>

    </div>
  );
}

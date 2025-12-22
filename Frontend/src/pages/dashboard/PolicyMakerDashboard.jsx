import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productionAPI } from "../../api/productionAPI";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { alertAPI } from "../../api/alertAPI";
import { gisAPI } from "../../api/gisApi";
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  Map as MapIcon,
  CloudSun,
  ArrowRight,
  Calculator,
  PieChart as PieChartIcon,
  ShoppingCart,
  Truck
} from "lucide-react";

// Premium Stat Card
const StatCard = ({ title, value, unit, icon: Icon, color = "blue", subtext }) => {
  const theme = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600 border-blue-100",
    emerald: "from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "from-rose-500 to-rose-600 bg-rose-50 text-rose-600 border-rose-100",
    amber: "from-amber-500 to-amber-600 bg-amber-50 text-amber-600 border-amber-100",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  const activeTheme = theme[color] || theme.blue;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br ${activeTheme.split(' ').slice(0, 2).join(' ')} bg-clip-text text-transparent`}>
        <Icon size={80} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activeTheme.split(' ').slice(2).join(' ')}`}>
          <Icon size={24} />
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 flex items-end gap-1">
          {value}
          {unit && <span className="text-sm text-slate-400 font-medium mb-1.5">{unit}</span>}
        </h3>
        {subtext && <p className={`text-xs font-bold mt-2 ${color === 'rose' ? 'text-rose-500' : 'text-slate-400'}`}>{subtext}</p>}
      </div>
    </div>
  );
};

// Quick Action Card
const ActionCard = ({ title, desc, icon: Icon, onClick, color = "indigo" }) => {
  const colors = {
    indigo: "group-hover:text-indigo-600 bg-indigo-50 text-indigo-600",
    emerald: "group-hover:text-emerald-600 bg-emerald-50 text-emerald-600",
    blue: "group-hover:text-blue-600 bg-blue-50 text-blue-600",
    rose: "group-hover:text-rose-600 bg-rose-50 text-rose-600",
  }
  return (
    <button onClick={onClick} className="w-full text-left group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl transition-colors ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">{desc}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center text-slate-400 text-xs font-bold uppercase tracking-wide group-hover:text-slate-600 transition-colors">
        Launch Tool <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

const PolicyMakerDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [deficitSummary, setDeficitSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [defaultDistrict, setDefaultDistrict] = useState(null);

  // Chart Data State
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, deficitRes, alertsRes, districtRes] = await Promise.all([
        productionAPI.getSummary({ year: "2024-25" }),
        surplusDeficitAPI.getSummary({ year: "2024-25" }),
        alertAPI.getSummary(),
        gisAPI.getDistricts({ limit: 1 })
      ]);
      setSummary(prodRes.data.data);
      setDeficitSummary(deficitRes.data.data);
      setAlertsSummary(alertsRes.data.data);

      if (districtRes.data.data && districtRes.data.data.length > 0) {
        setDefaultDistrict(districtRes.data.data[0]);
      }

      // Prepare Chart Data
      const statusBreakdown = deficitRes.data.data.statusBreakdown;
      setStatusData([
        { name: 'Surplus', value: statusBreakdown.surplus, color: '#10b981' }, // Emerald-500
        { name: 'Balanced', value: statusBreakdown.balanced, color: '#3b82f6' }, // Blue-500
        { name: 'Deficit', value: statusBreakdown.deficit, color: '#ef4444' }, // Red-500
      ]);

    } catch (error) {
      showError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* Header Section with Weather Integration */}
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Hero Card */}
          <div className="flex-grow bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <div className="relative z-10">
              <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">{currentDate}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
                Policy Overview
              </h1>
              <p className="text-slate-400 max-w-xl text-lg">
                Strategic insights into national food security, production metrics, and critical regional statuses.
              </p>
            </div>
          </div>

          {/* Weather Widget Container */}
          {defaultDistrict && (
            <div className="w-full xl:w-96 flex-shrink-0 bg-white rounded-3xl p-1 border border-slate-100 shadow-xl shadow-slate-200/50">
              <WeatherWidget
                districtId={defaultDistrict._id}
                districtName={defaultDistrict.name}
              />
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Production"
            value={summary?.totalProduction ? (summary.totalProduction / 1000000).toFixed(2) : 0}
            unit="M Tonnes"
            icon={TrendingUp}
            color="emerald"
            subtext="National Aggregate"
          />
          <StatCard
            title="Average Yield"
            value={summary?.avgYield?.toFixed(2) || 0}
            unit="T/Ha"
            icon={PieChartIcon}
            color="blue"
            subtext="Per Hectare Efficiency"
          />
          <StatCard
            title="In Deficit"
            value={deficitSummary?.statusBreakdown?.deficit || 0}
            unit="Regions"
            icon={AlertTriangle}
            color="rose"
            subtext={`Critical: ${deficitSummary?.severityBreakdown?.critical || 0}`}
          />
          <StatCard
            title="Active Alerts"
            value={alertsSummary?.activeAlerts || 0}
            unit="Issues"
            icon={AlertTriangle}
            color="amber"
            subtext={`${alertsSummary?.unacknowledgedAlerts || 0} Unread`}
          />
        </div>

        {/* Analysis & Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Analysis & Charts */}
          <div className="lg:col-span-2 space-y-8">

            {/* Regional Status Breakdown */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Regional Security Status</h3>
                  <p className="text-slate-500 text-sm mt-1">Distribution of surplus vs deficit regions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Surplus
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Deficit
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {deficitSummary?.statusBreakdown?.deficit + deficitSummary?.statusBreakdown?.surplus + deficitSummary?.statusBreakdown?.balanced || 0}
                    </span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Regions</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-orange-600 font-bold text-sm uppercase tracking-wide">Requires Intervention</span>
                      <AlertTriangle size={18} className="text-orange-500" />
                    </div>
                    <p className="text-3xl font-extrabold text-slate-800">
                      {deficitSummary?.requiresIntervention || 0}
                      <span className="text-sm text-slate-400 font-medium ml-2">regions</span>
                    </p>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Immediate policy action is recommended for <span className="font-bold text-slate-800">{deficitSummary?.severityBreakdown?.critical || 0} critical regions</span> facing severe food shortages.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Col: Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 px-2">Operational Tools</h3>

            <ActionCard
              title="Production Analysis"
              desc="Deep dive into crop yields and historical trends."
              icon={TrendingUp}
              color="blue"
              onClick={() => navigate("/production/analysis")}
            />
            <ActionCard
              title="Calculate Deficit"
              desc="Run new calculations based on latest data."
              icon={Calculator}
              color="indigo"
              onClick={() => navigate("/surplus-deficit/calculate")}
            />
            <ActionCard
              title="Deficit Regions"
              desc="View detailed map and list of affected areas."
              icon={MapIcon}
              color="rose"
              onClick={() => navigate("/surplus-deficit/deficit-regions")}
            />
            <ActionCard
              title="Generate Reports"
              desc="Create official PDF reports for stakeholders."
              icon={FileText}
              color="emerald"
              onClick={() => navigate("/reports/generate")}
            />

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate("/market")} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-lg transition text-center flex flex-col items-center gap-2 group">
                <ShoppingCart size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600">Market</span>
              </button>
              <button onClick={() => navigate("/distribution")} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-lg transition text-center flex flex-col items-center gap-2 group">
                <Truck size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600">Logistics</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
};

export default PolicyMakerDashboard;

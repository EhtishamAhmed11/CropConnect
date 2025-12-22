import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";
import {
  HeartHandshake,
  MapPin,
  AlertCircle,
  ArrowRight,
  Truck,
  Users,
  Package
} from "lucide-react";

// NGO-themed Stat Card
const ReliefStatCard = ({ title, value, label, icon: Icon, color = "emerald" }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${color === 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${color === 'red' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-4xl font-extrabold text-slate-800 mb-1">{value}</h3>
        <p className="text-slate-900 font-bold text-sm">{title}</p>
        <p className="text-slate-400 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

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

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* NGO Hero */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/10 text-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">NGO Coordinator</span>
                <span className="text-emerald-400 font-bold text-xs uppercase">{currentDate}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                Humanitarian Relief Hub
              </h1>
              <p className="text-emerald-100/80 max-w-xl text-lg leading-relaxed">
                Monitor critical food shortages, coordinate redistribution efforts, and manage emergency alerts efficiently.
              </p>

              <div className="flex gap-4 mt-8">
                <button onClick={() => navigate("/surplus-deficit/redistribution")} className="bg-white text-emerald-800 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-white/20 transition-all active:scale-95 flex items-center gap-2">
                  <Truck size={20} />
                  Start Redistribution
                </button>
                <button onClick={() => navigate("/surplus-deficit/deficit-regions")} className="bg-emerald-700/50 text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-emerald-700/70 transition-all flex items-center gap-2">
                  <MapPin size={20} />
                  View Map
                </button>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl text-center">
                <p className="text-3xl font-extrabold text-white">{deficitRegions.length}</p>
                <p className="text-xs text-emerald-200 font-bold uppercase mt-1">Critical Zones</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl text-center">
                <p className="text-3xl font-extrabold text-white">{criticalAlerts.length}</p>
                <p className="text-xs text-emerald-200 font-bold uppercase mt-1">SOS Alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Critical Regions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                Priority Intervention Areas
              </h2>
              <button onClick={() => navigate("/surplus-deficit/deficit-regions")} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                View Full Report <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deficitRegions.length > 0 ? (
                deficitRegions.slice(0, 6).map((region, index) => (
                  <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-sm border border-red-100">
                          {region.region.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{region.region.name}</h3>
                          <p className="text-xs text-slate-500">{region.crop}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                        -{region.deficitPercentage}%
                      </span>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Shortfall</span>
                        <span className="text-slate-800 font-bold">{Math.abs(region.balance).toLocaleString()} T</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <button className="w-full py-2 mt-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-100 transition-colors">
                        Plan Logistics
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <HeartHandshake className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-slate-500 font-medium">No critical regions currently identified.</p>
                  <p className="text-slate-400 text-sm">Great job keeping the nation secure!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Alerts Feed */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 px-2">Live Alert Feed</h2>
            <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-xl shadow-slate-200/50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {criticalAlerts.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {criticalAlerts.map((alert) => (
                    <div key={alert._id} className="p-4 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-red-600 transition-colors">{alert.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{alert.message}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-wide">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400 text-sm">No active emergency alerts.</p>
                </div>
              )}
              <div className="p-4 border-t border-slate-50">
                <button onClick={() => navigate("/alerts")} className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                  View All Alerts
                </button>
              </div>
            </div>

            {/* Secondary Action */}
            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 text-indigo-900">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-indigo-500" />
                <h3 className="font-bold">Volunteer Network</h3>
              </div>
              <p className="text-sm text-indigo-700/80 mb-4">Coordinate with 1,240 active volunteers in the field.</p>
              <button className="text-xs font-bold bg-white px-4 py-2 rounded-lg shadow-sm text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors">
                Access Portal
              </button>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default NGODashboard;

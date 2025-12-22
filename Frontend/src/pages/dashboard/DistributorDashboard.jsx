import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { alertAPI } from "../../api/alertAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";
import {
  Truck,
  Package,
  MapPin,
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

// Distributor Stat Card
const StatWidget = ({ title, value, icon: Icon, color }) => {
  const theme = {
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
  }
  const t = theme[color] || theme.blue;
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${t}`}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
      </div>
    </div>
  );
};

const QuickLink = ({ title, icon: Icon, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 group">
    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
      <Icon size={24} />
    </div>
    <span className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{title}</span>
  </button>
)

const DistributorDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        alertAPI.getActive({ limit: 10 }),
        alertAPI.getSummary(),
      ]);

      setAlerts(alertsRes.data.data);
      setAlertsSummary(summaryRes.data.data);
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

        {/* Distributor Hero */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-white">
          {/* Decorative Elements */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-orange-500/10 skew-x-12 transform origin-top-right"></div>
          <div className="absolute right-20 bottom-0 h-64 w-64 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end gap-6">
            <div>
              <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">{currentDate}</p>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Logistics Control
              </h1>
              <p className="text-slate-400 text-lg max-w-xl">
                Manage inventory distribution, track regional surplus, and respond to supply chain alerts.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-3xl font-extrabold">{alertsSummary?.activeAlerts || 0}</p>
                <p className="text-xs font-bold text-orange-400 uppercase">Pending Actions</p>
              </div>
              <div className="w-px bg-white/20 h-10 self-center"></div>
              <div className="text-right">
                <p className="text-3xl font-extrabold">12</p>
                <p className="text-xs font-bold text-purple-400 uppercase">Active Compaines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left Col: Stats & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <StatWidget
              title="Total Notifications"
              value={alertsSummary?.totalAlerts || 0}
              icon={Bell}
              color="purple"
            />
            <StatWidget
              title="Unacknowledged"
              value={alertsSummary?.unacknowledgedAlerts || 0}
              icon={AlertTriangle}
              color="orange"
            />

            <h3 className="font-bold text-slate-800 ml-2 mt-8">Quick Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickLink title="Alerts" icon={Bell} onClick={() => navigate("/alerts")} />
              <QuickLink title="Surplus" icon={Package} onClick={() => navigate("/surplus-deficit/surplus-regions")} />
              <QuickLink title="Profile" icon={Truck} onClick={() => navigate("/profile")} />
              <QuickLink title="Map" icon={MapPin} onClick={() => navigate("/gis")} />
            </div>
          </div>

          {/* Right Col: Active Alerts Feed */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Priority Notifications</h2>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Live Feed
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert._id} className="p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex gap-4 items-start">
                          <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {alert.severity === 'critical' ? <AlertTriangle size={20} /> : <Bell size={20} />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors mb-1">{alert.title}</h3>
                            <p className="text-sm text-slate-500 max-w-2xl">{alert.message}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                <Clock size={12} /> {new Date(alert.createdAt).toLocaleString()}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${alert.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                {alert.severity} Priority
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm">
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
                    <p className="font-medium">All caught up! No active alerts.</p>
                  </div>
                )}
              </div>

              {alerts.length > 0 && (
                <div className="p-4 bg-slate-50 text-center">
                  <button onClick={() => navigate("/alerts")} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    View All History
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default DistributorDashboard;

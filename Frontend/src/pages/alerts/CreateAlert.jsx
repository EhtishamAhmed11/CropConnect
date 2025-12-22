import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { alertAPI } from "../../api/alertAPI";
import { gisAPI } from "../../api/gisApi";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import {
  AlertTriangle,
  Send,
  X,
  MapPin,
  Users,
  Layers,
  Info
} from "lucide-react";

export default function CreateAlert() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [severity, setSeverity] = useState("low");
  const [targetRoles, setTargetRoles] = useState(["all"]);
  const [targetUsers, setTargetUsers] = useState([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [metadata, setMetadata] = useState("");
  const [deliveryChannels, setDeliveryChannels] = useState({
    inApp: true,
    email: false,
    push: false,
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();

  const alertTypes = [
    { value: "deficit_critical", label: "Critical Deficit" },
    { value: "production_drop", label: "Production Drop" },
    { value: "surplus_alert", label: "Surplus Alert" },
    { value: "pest_disease", label: "Pest/Disease Alert" },
    { value: "harvest_season", label: "Harvest Season" },
    { value: "policy_update", label: "Policy Update" },
    { value: "custom", label: "Custom Alert" },
  ];

  const roles = [
    { value: "all", label: "All Users" },
    { value: "admin", label: "Admin" },
    { value: "government_policy_maker", label: "Policy Maker" },
    { value: "ngo_coordinator", label: "NGO" },
    { value: "distributor", label: "Distributor" },
  ];

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await gisAPI.getProvinces();
        const provList = Array.isArray(res.data) ? res.data : res.data.provinces || res.data.data || [];
        setProvinces(provList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await adminAPI.getAllUsers();
        const userList = Array.isArray(res.data) ? res.data : res.data.users || res.data.data || [];
        setUsers(userList);
      } catch (err) {
        console.warn("Users endpoint not available:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setDistrict("");
      setSelectedDistrictId("");
      return;
    }
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await gisAPI.getDistricts({ provinceCode: province });
        const distList = Array.isArray(res.data) ? res.data : res.data.districts || res.data.data || [];
        setDistricts(distList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [province]);

  useEffect(() => {
    if (severity === "critical" || severity === "high") {
      setDeliveryChannels((prev) => ({ ...prev, email: true }));
    }
  }, [severity]);

  const handleRoleToggle = (roleValue) => {
    setTargetRoles((prev) => {
      if (roleValue === "all") {
        return prev.includes("all") ? [] : ["all"];
      }
      const newRoles = prev.includes(roleValue)
        ? prev.filter((r) => r !== roleValue)
        : [...prev.filter((r) => r !== "all"), roleValue];
      return newRoles.length === 0 ? ["all"] : newRoles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !alertType.trim()) return showError("Required fields missing");
    if (targetRoles.length === 0 && targetUsers.length === 0) return showError("Select at least one target");

    let parsedMetadata = null;
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (err) {
        return showError("Metadata must be valid JSON");
      }
    }

    setSubmitting(true);
    try {
      const newAlert = {
        title: title.trim(),
        message: message.trim(),
        alertType,
        severity,
        targetRoles,
        deliveryChannels,
        ...(targetUsers.length > 0 && { targetUsers }),
        ...(selectedProvinceId && { province: selectedProvinceId }),
        ...(selectedDistrictId && { district: selectedDistrictId }),
        ...(parsedMetadata && { metadata: parsedMetadata }),
      };

      await alertAPI.create(newAlert);
      showSuccess("Alert broadcasted successfully");
      navigate("/alerts");
    } catch (error) {
      console.error(error);
      showError("Failed to broadcast alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Create Broadcast</h1>
            <p className="text-slate-500 text-sm">Compose and distribute system-wide alerts.</p>
          </div>
          <button onClick={() => navigate("/alerts")} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Info size={18} className="text-blue-500" /> Alert Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Type</label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 font-medium"
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {alertTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Severity</label>
                  <select
                    className={`w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold ${severity === 'critical' ? 'bg-red-50 text-red-600' :
                        severity === 'high' ? 'bg-orange-50 text-orange-600' :
                          'bg-slate-50 text-slate-700'
                      }`}
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Title</label>
                <input
                  type="text"
                  placeholder="E.g. System Maintenance Scheduled"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message</label>
                <textarea
                  placeholder="Detailed description of the alert..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-medium min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-emerald-500" /> Regional Targeting
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Province</label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    value={province}
                    onChange={(e) => {
                      const code = e.target.value;
                      setProvince(code);
                      setSelectedProvinceId(provinces.find(p => p.code === code)?._id || "");
                    }}
                  >
                    <option value="">Global (All Provinces)</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">District</label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium disabled:opacity-50"
                    value={district}
                    onChange={(e) => {
                      const code = e.target.value;
                      setDistrict(code);
                      setSelectedDistrictId(districts.find(d => d.code === code)?._id || "");
                    }}
                    disabled={!province}
                  >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Audience & Publish */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Users size={18} className="text-purple-500" /> Audience
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes("all")}
                    onChange={() => handleRoleToggle("all")}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700 text-sm">All Users</span>
                </label>

                {!targetRoles.includes("all") && roles.filter(r => r.value !== 'all').map(role => (
                  <label key={role.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ml-4">
                    <input
                      type="checkbox"
                      checked={targetRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-600 text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Layers size={18} className="text-orange-500" /> Channels
              </h2>
              <div className="space-y-4">
                {Object.keys(deliveryChannels).map(channel => (
                  <label key={channel} className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-600 capitalize">{channel === 'inApp' ? 'In-App' : channel}</span>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${deliveryChannels[channel] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={deliveryChannels[channel]}
                        onChange={(e) => setDeliveryChannels(prev => ({ ...prev, [channel]: e.target.checked }))}
                      />
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${deliveryChannels[channel] ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                ))}
                {(severity === 'critical' || severity === 'high') && (
                  <p className="text-xs text-orange-500 font-bold bg-orange-50 p-2 rounded-lg">
                    Note: Email is mandatory for High/Critical alerts.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={20} /> Broadcast Now</>}
            </button>

          </div>

        </form>
      </div>
    </Layout>
  );
}

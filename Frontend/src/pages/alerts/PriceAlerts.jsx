import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { priceThresholdAPI } from "../../api/priceThresholdAPI";
import { tollThresholdAPI } from "../../api/tollThresholdAPI";
import { useAlert } from "../../context/AlertContext";
import {
    DollarSign,
    Truck,
    Plus,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Play,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

export default function PriceAlerts() {
    const [priceThresholds, setPriceThresholds] = useState([]);
    const [tollThresholds, setTollThresholds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("price");
    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [priceRes, tollRes] = await Promise.all([
                priceThresholdAPI.getAll(),
                tollThresholdAPI.getAll(),
            ]);
            setPriceThresholds(priceRes.data?.data || []);
            setTollThresholds(tollRes.data?.data || []);
        } catch (err) {
            console.error(err);
            showError("Failed to load thresholds");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePrice = async (id) => {
        try {
            await priceThresholdAPI.toggle(id);
            showSuccess("Threshold toggled");
            loadData();
        } catch (err) {
            showError("Failed to toggle threshold");
        }
    };

    const handleToggleToll = async (id) => {
        try {
            await tollThresholdAPI.toggle(id);
            showSuccess("Threshold toggled");
            loadData();
        } catch (err) {
            showError("Failed to toggle threshold");
        }
    };

    const handleDeletePrice = async (id) => {
        if (!window.confirm("Delete this price threshold?")) return;
        try {
            await priceThresholdAPI.delete(id);
            showSuccess("Threshold deleted");
            loadData();
        } catch (err) {
            showError("Failed to delete threshold");
        }
    };

    const handleDeleteToll = async (id) => {
        if (!window.confirm("Delete this toll threshold?")) return;
        try {
            await tollThresholdAPI.delete(id);
            showSuccess("Threshold deleted");
            loadData();
        } catch (err) {
            showError("Failed to delete threshold");
        }
    };

    const handleCheckPrice = async (id) => {
        try {
            const res = await priceThresholdAPI.check(id);
            showSuccess(res.data?.message || "Check complete");
        } catch (err) {
            showError("Check failed");
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            critical: "bg-red-100 text-red-700",
            high: "bg-orange-100 text-orange-700",
            medium: "bg-yellow-100 text-yellow-700",
            low: "bg-green-100 text-green-700",
        };
        return colors[severity] || "bg-gray-100 text-gray-700";
    };

    return (
        <Layout>
            <div className="font-['Outfit'] space-y-6 p-2">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800">
                            Price & Toll Alerts
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage automated price and toll monitoring thresholds
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/alerts/price/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                        >
                            <Plus size={18} />
                            New Price Alert
                        </button>
                        <button
                            onClick={() => navigate("/alerts/toll/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
                        >
                            <Truck size={18} />
                            New Toll Alert
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("price")}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "price"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <DollarSign size={18} className="inline mr-2" />
                        Price Thresholds ({priceThresholds.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("toll")}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "toll"
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Truck size={18} className="inline mr-2" />
                        Toll Thresholds ({tollThresholds.length})
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <RefreshCw size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : activeTab === "price" ? (
                    <div className="space-y-4">
                        {priceThresholds.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl text-center">
                                <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">No price thresholds configured</p>
                                <button
                                    onClick={() => navigate("/alerts/price/create")}
                                    className="mt-4 text-blue-600 font-medium hover:underline"
                                >
                                    Create your first price alert
                                </button>
                            </div>
                        ) : (
                            priceThresholds.map((t) => (
                                <div
                                    key={t._id}
                                    className={`bg-white p-6 rounded-2xl border ${t.isActive ? "border-slate-100" : "border-slate-200 opacity-60"
                                        } shadow-lg`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg text-slate-800">
                                                    {t.cropType?.name || "Unknown Crop"}
                                                </span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(
                                                        t.alertSeverity
                                                    )}`}
                                                >
                                                    {t.alertSeverity}
                                                </span>
                                                {t.isGlobal && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                                        Global
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-sm">
                                                {t.thresholdType === "above" &&
                                                    `Alert when price > ${t.upperLimit} PKR`}
                                                {t.thresholdType === "below" &&
                                                    `Alert when price < ${t.lowerLimit} PKR`}
                                                {t.thresholdType === "both" &&
                                                    `Alert when price > ${t.upperLimit} or < ${t.lowerLimit} PKR`}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                {t.district?.name || "All Districts"} • Cooldown:{" "}
                                                {t.cooldownHours}h • Triggered: {t.triggerCount}x
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCheckPrice(t._id)}
                                                className="p-2 rounded-lg hover:bg-slate-100 text-blue-500"
                                                title="Check now"
                                            >
                                                <Play size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleTogglePrice(t._id)}
                                                className={`p-2 rounded-lg ${t.isActive
                                                        ? "text-emerald-500 hover:bg-emerald-50"
                                                        : "text-slate-400 hover:bg-slate-100"
                                                    }`}
                                                title={t.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {t.isActive ? (
                                                    <ToggleRight size={24} />
                                                ) : (
                                                    <ToggleLeft size={24} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeletePrice(t._id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tollThresholds.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl text-center">
                                <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">No toll thresholds configured</p>
                                <button
                                    onClick={() => navigate("/alerts/toll/create")}
                                    className="mt-4 text-emerald-600 font-medium hover:underline"
                                >
                                    Create your first toll alert
                                </button>
                            </div>
                        ) : (
                            tollThresholds.map((t) => (
                                <div
                                    key={t._id}
                                    className={`bg-white p-6 rounded-2xl border ${t.isActive ? "border-slate-100" : "border-slate-200 opacity-60"
                                        } shadow-lg`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg text-slate-800">
                                                    {t.tollRoute?.routeName || "All Routes"}
                                                </span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(
                                                        t.alertSeverity
                                                    )}`}
                                                >
                                                    {t.alertSeverity}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-sm">
                                                Alert when {t.vehicleType} toll exceeds {t.maxTollAmount} PKR
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                Cooldown: {t.cooldownHours}h • Triggered: {t.triggerCount}x
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleToll(t._id)}
                                                className={`p-2 rounded-lg ${t.isActive
                                                        ? "text-emerald-500 hover:bg-emerald-50"
                                                        : "text-slate-400 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {t.isActive ? (
                                                    <ToggleRight size={24} />
                                                ) : (
                                                    <ToggleLeft size={24} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteToll(t._id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}

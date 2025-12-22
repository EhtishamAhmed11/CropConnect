import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { tollThresholdAPI } from "../../api/tollThresholdAPI";
import { useAlert } from "../../context/AlertContext";
import { ArrowLeft, Save, Truck } from "lucide-react";

export default function CreateTollThreshold() {
    const [tollRoute, setTollRoute] = useState("");
    const [vehicleType, setVehicleType] = useState("articulatedTruck");
    const [maxTollAmount, setMaxTollAmount] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("medium");
    const [cooldownHours, setCooldownHours] = useState(24);
    const [isGlobal, setIsGlobal] = useState(false);

    const [tollRates, setTollRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();

    const vehicleTypes = [
        { value: "car", label: "Car" },
        { value: "wagon", label: "Wagon" },
        { value: "wagonUpto12Seater", label: "Wagon (up to 12 seater)" },
        { value: "coasterMiniBus", label: "Coaster/Mini Bus" },
        { value: "bus", label: "Bus" },
        { value: "twoThreeAxleTruck", label: "2 & 3 Axle Truck" },
        { value: "articulatedTruck", label: "Articulated Truck" },
    ];

    useEffect(() => {
        loadTollRates();
    }, []);

    const loadTollRates = async () => {
        setLoading(true);
        try {
            const res = await tollThresholdAPI.getRates();
            setTollRates(res.data?.data || []);
        } catch (err) {
            console.error("Failed to load toll rates:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!vehicleType || !maxTollAmount) {
            return showError("Please fill in all required fields");
        }

        setSubmitting(true);
        try {
            await tollThresholdAPI.create({
                tollRoute: tollRoute || undefined,
                vehicleType,
                maxTollAmount: parseFloat(maxTollAmount),
                alertSeverity,
                cooldownHours: parseInt(cooldownHours),
                isGlobal,
            });
            showSuccess("Toll threshold created successfully");
            navigate("/alerts/price");
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.message || "Failed to create threshold");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="font-['Outfit'] space-y-6 p-2 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <button
                        onClick={() => navigate("/alerts/price")}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800">
                            Create Toll Alert
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Set up automated toll cost monitoring
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6"
                >
                    {/* Route Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Route <span className="text-slate-400">(Optional)</span>
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={tollRoute}
                            onChange={(e) => setTollRoute(e.target.value)}
                        >
                            <option value="">All Routes (Monitor All)</option>
                            {tollRates.map((r) => (
                                <option key={r._id} value={r._id}>
                                    {r.routeName} - {r.routeSegment}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400">
                            Leave empty to monitor all routes
                        </p>
                    </div>

                    {/* Vehicle Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Vehicle Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            required
                        >
                            {vehicleTypes.map((v) => (
                                <option key={v.value} value={v.value}>
                                    {v.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Max Toll Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Maximum Toll Amount (PKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 3000"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={maxTollAmount}
                            onChange={(e) => setMaxTollAmount(e.target.value)}
                            required
                        />
                        <p className="text-xs text-slate-400">
                            Alert when toll exceeds this amount
                        </p>
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Severity</label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={alertSeverity}
                            onChange={(e) => setAlertSeverity(e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    {/* Cooldown */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Cooldown (hours between alerts)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="168"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={cooldownHours}
                            onChange={(e) => setCooldownHours(e.target.value)}
                        />
                    </div>

                    {/* Global Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-700">Global Alert</p>
                            <p className="text-sm text-slate-500">
                                Make this alert visible to all users
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsGlobal(!isGlobal)}
                            className={`w-14 h-8 rounded-full transition-colors ${isGlobal ? "bg-purple-500" : "bg-slate-300"
                                }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ml-1 ${isGlobal ? "translate-x-6" : ""
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                    >
                        {submitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Truck size={20} />
                                Create Toll Alert
                            </>
                        )}
                    </button>
                </form>

                {/* Current Toll Rates Reference */}
                {tollRates.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="font-bold text-slate-700 mb-4">
                            Current Toll Rates Reference
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {tollRates.slice(0, 5).map((r) => (
                                <div
                                    key={r._id}
                                    className="flex justify-between items-center p-3 bg-slate-50 rounded-xl"
                                >
                                    <span className="text-sm font-medium text-slate-600">
                                        {r.routeSegment}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        Truck: {r.rates?.articulatedTruck || "N/A"} PKR
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

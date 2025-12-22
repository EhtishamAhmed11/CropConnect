import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { priceThresholdAPI } from "../../api/priceThresholdAPI";
import { productionAPI } from "../../api/productionAPI";
import { gisAPI } from "../../api/gisApi";
import { useAlert } from "../../context/AlertContext";
import { ArrowLeft, Save, DollarSign } from "lucide-react";

export default function CreatePriceThreshold() {
    const [cropType, setCropType] = useState("");
    const [district, setDistrict] = useState("");
    const [thresholdType, setThresholdType] = useState("above");
    const [upperLimit, setUpperLimit] = useState("");
    const [lowerLimit, setLowerLimit] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("medium");
    const [cooldownHours, setCooldownHours] = useState(4);
    const [isGlobal, setIsGlobal] = useState(false);

    const [crops, setCrops] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingCrops, setLoadingCrops] = useState(true);

    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();

    useEffect(() => {
        loadCrops();
        loadDistricts();
    }, []);

    const loadCrops = async () => {
        setLoadingCrops(true);
        try {
            // Get crops from dedicated crop types endpoint
            const res = await productionAPI.getCropTypes();
            const cropData = res.data?.data || [];
            setCrops(cropData);
        } catch (err) {
            console.error("Failed to load crops:", err);
        } finally {
            setLoadingCrops(false);
        }
    };

    const loadDistricts = async () => {
        try {
            const res = await gisAPI.getDistricts();
            const distList = Array.isArray(res.data) ? res.data : res.data?.data || [];
            setDistricts(distList);
        } catch (err) {
            console.error("Failed to load districts:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!cropType) {
            return showError("Please select a crop");
        }

        if (thresholdType === "above" && !upperLimit) {
            return showError("Please enter an upper limit");
        }

        if (thresholdType === "below" && !lowerLimit) {
            return showError("Please enter a lower limit");
        }

        if (thresholdType === "both" && (!upperLimit || !lowerLimit)) {
            return showError("Please enter both upper and lower limits");
        }

        setSubmitting(true);
        try {
            await priceThresholdAPI.create({
                cropType,
                district: district || undefined,
                thresholdType,
                upperLimit: upperLimit ? parseFloat(upperLimit) : undefined,
                lowerLimit: lowerLimit ? parseFloat(lowerLimit) : undefined,
                alertSeverity,
                cooldownHours: parseInt(cooldownHours),
                isGlobal,
            });
            showSuccess("Price threshold created successfully");
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
                            Create Price Alert
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Set up automated price monitoring
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6"
                >
                    {/* Crop Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Crop <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={cropType}
                            onChange={(e) => setCropType(e.target.value)}
                            required
                        >
                            <option value="">Select Crop</option>
                            {crops.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* District (Optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            District <span className="text-slate-400">(Optional)</span>
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                        >
                            <option value="">All Districts</option>
                            {districts.map((d) => (
                                <option key={d._id} value={d._id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Threshold Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Alert When Price Is
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {["above", "below", "both"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setThresholdType(type)}
                                    className={`p-3 rounded-xl border font-medium capitalize transition-all ${thresholdType === type
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {type === "both" ? "Above or Below" : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        {(thresholdType === "above" || thresholdType === "both") && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    Upper Limit (PKR)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g., 5000"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                    value={upperLimit}
                                    onChange={(e) => setUpperLimit(e.target.value)}
                                />
                            </div>
                        )}
                        {(thresholdType === "below" || thresholdType === "both") && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    Lower Limit (PKR)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g., 1000"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                    value={lowerLimit}
                                    onChange={(e) => setLowerLimit(e.target.value)}
                                />
                            </div>
                        )}
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
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                    >
                        {submitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Create Price Alert
                            </>
                        )}
                    </button>
                </form>
            </div>
        </Layout>
    );
}

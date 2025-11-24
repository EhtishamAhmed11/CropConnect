import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { alertAPI } from "../../api/alertAPI";
import { gisAPI } from "../../api/gisAPI";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";

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

  // Available alert types (must match backend enum exactly)
  const alertTypes = [
    { value: "deficit_critical", label: "Critical Deficit" },
    { value: "production_drop", label: "Production Drop" },
    { value: "surplus_alert", label: "Surplus Alert" },
    { value: "pest_disease", label: "Pest/Disease Alert" },
    { value: "harvest_season", label: "Harvest Season" },
    { value: "policy_update", label: "Policy Update" },
    { value: "custom", label: "Custom Alert" },
  ];

  // Available roles
  const roles = [
    { value: "all", label: "All Users" },
    { value: "admin", label: "Admin" },
    { value: "government_policy_maker", label: "Government Policy Maker" },
    { value: "ngo_coordinator", label: "NGO Coordinator" },
    { value: "distributor", label: "Distributor" },
  ];

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await gisAPI.getProvinces();
        const provList = Array.isArray(res.data)
          ? res.data
          : res.data.provinces || res.data.data || [];
        setProvinces(provList);
        console.log("Loaded provinces:", provList); // Debug log
      } catch (err) {
        console.error(err);
        showError("Failed to load provinces");
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
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
        const distList = Array.isArray(res.data)
          ? res.data
          : res.data.districts || res.data.data || [];
        setDistricts(distList);
        console.log("Loaded districts:", distList); // Debug log
      } catch (err) {
        console.error(err);
        showError("Failed to load districts");
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [province]);

  // Load users for targeting
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await adminAPI.getAllUsers();
        const userList = Array.isArray(res.data)
          ? res.data
          : res.data.users || res.data.data || [];
        setUsers(userList);
      } catch (err) {
        // Silently fail if endpoint doesn't exist or user doesn't have permission
        console.warn("Users endpoint not available:", err.response?.status);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Auto-set email delivery for high/critical severity
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

  const handleUserToggle = (userId) => {
    setTargetUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim() || !alertType.trim()) {
      return showError("Title, message, and alert type are required");
    }

    if (targetRoles.length === 0 && targetUsers.length === 0) {
      return showError("Please select at least one target role or user");
    }

    // Parse metadata JSON
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
      };

      // Add optional fields only if they have values
      if (targetUsers.length > 0) {
        newAlert.targetUsers = targetUsers;
      }

      // Send ObjectIDs for province and district, not codes
      if (selectedProvinceId) {
        newAlert.province = selectedProvinceId;
      }

      if (selectedDistrictId) {
        newAlert.district = selectedDistrictId;
      }

      // Don't send cropType - backend expects ObjectID reference which we don't have
      // If you need crop filtering, handle it differently or ask backend to accept string
      // if (cropType) {
      //   newAlert.cropType = cropType;
      // }

      if (parsedMetadata) {
        newAlert.metadata = parsedMetadata;
      }

      // Log what we're sending for debugging
      console.log("Sending alert data:", JSON.stringify(newAlert, null, 2));

      const response = await alertAPI.create(newAlert);
      console.log("Alert created:", response.data);

      showSuccess(response.data?.message || "Alert created successfully");

      // Reset form
      setTitle("");
      setMessage("");
      setAlertType("");
      setSeverity("low");
      setTargetRoles(["all"]);
      setTargetUsers([]);
      setProvince("");
      setDistrict("");
      setSelectedProvinceId("");
      setSelectedDistrictId("");
      setMetadata("");
      setDeliveryChannels({ inApp: true, email: false, push: false });

      navigate("/alerts");
    } catch (error) {
      console.error("Alert creation error:", error);
      console.error(
        "Error response:",
        JSON.stringify(error.response?.data, null, 2)
      );

      // Extract validation errors if they exist
      const validationErrors = error.response?.data?.errors;
      const errorMessage =
        validationErrors && Array.isArray(validationErrors)
          ? `Validation Error: ${validationErrors
            .map((e) => e.message || e.msg || e)
            .join(", ")}`
          : error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create alert";

      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="bg-white shadow rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Alert</h2>
          <button
            onClick={() => navigate("/alerts")}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter alert title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter alert message"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alert Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                required
              >
                <option value="">Select Alert Type</option>
                {alertTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Roles <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Specific Users (Optional) */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Specific Users (Optional)
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <p className="text-gray-500 text-sm">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-500 text-sm">No users available</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={targetUsers.includes(user._id)}
                          onChange={() => handleUserToggle(user._id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">
                          {user.fullName || user.username}
                          {user.role && (
                            <span className="text-gray-500 text-xs ml-2">
                              ({user.role})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province (Optional)
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={province}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  setProvince(selectedCode);
                  const selectedProv = provinces.find(
                    (p) => p.code === selectedCode
                  );
                  console.log("Selected province:", selectedProv); // Debug
                  setSelectedProvinceId(selectedProv?._id || "");
                }}
                disabled={loadingProvinces}
              >
                <option value="">All Provinces</option>
                {provinces.map((p) => (
                  <option key={p.code || p._id} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District (Optional)
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={district}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  setDistrict(selectedCode);
                  const selectedDist = districts.find(
                    (d) => d.code === selectedCode
                  );
                  console.log("Selected district:", selectedDist); // Debug
                  setSelectedDistrictId(selectedDist?._id || "");
                }}
                disabled={!province || loadingDistricts}
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d.code || d._id} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Crop Type - Removed since backend expects ObjectID reference
              You can add this back when you have a crops API endpoint */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Type (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., wheat, rice, cotton"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter crop name or leave empty for all crops
            </p>
          </div> */}

          {/* Delivery Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Channels
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryChannels.inApp}
                  onChange={(e) =>
                    setDeliveryChannels((prev) => ({
                      ...prev,
                      inApp: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm">In-App Notification</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryChannels.email}
                  onChange={(e) =>
                    setDeliveryChannels((prev) => ({
                      ...prev,
                      email: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryChannels.push}
                  onChange={(e) =>
                    setDeliveryChannels((prev) => ({
                      ...prev,
                      push: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm">Push Notification</span>
              </label>
            </div>
            {(severity === "critical" || severity === "high") && (
              <p className="text-xs text-gray-500 mt-2">
                Email is automatically enabled for high/critical alerts
              </p>
            )}
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata (Optional JSON)
            </label>
            <textarea
              placeholder='{"key": "value"}'
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows="4"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter valid JSON for additional alert data
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting ? "Creating Alert..." : "Create Alert"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/alerts")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

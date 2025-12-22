import React, { useState, useEffect } from "react";
import { userAPI } from '../../api/usersAPI';
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  Camera,
  Loader,
  Check
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    fullName: "",
    phoneNumber: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.updateProfile(profileData);
      showSuccess("Profile updated successfully");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2 max-w-5xl mx-auto">

        {/* Profile Header / Hero */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden text-white flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User size={200} />
          </div>

          <div className="relative z-10 flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-1 shadow-2xl relative group cursor-pointer">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold">{user?.username?.[0]?.toUpperCase()}</span>
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center md:text-left flex-grow">
            <h1 className="text-3xl font-extrabold mb-2">{user?.fullName || user?.username}</h1>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-slate-700/50 backdrop-blur border border-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield size={12} className="text-emerald-400" /> {user?.role?.replace(/_/g, " ")}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-700/50 backdrop-blur border border-slate-600 text-xs font-bold flex items-center gap-2">
                <Mail size={12} className="text-blue-400" /> {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Sidebar Navigation */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === "profile"
                  ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <User size={18} /> Personal Info
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === "password"
                  ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <Key size={18} /> Security
            </button>
          </div>

          {/* Main Form Area */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">

              {activeTab === "profile" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                    <p className="text-slate-500 text-sm">Update your public profile details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          name="fullName"
                          value={profileData.fullName}
                          onChange={handleProfileChange}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          name="phoneNumber"
                          value={profileData.phoneNumber}
                          onChange={handleProfileChange}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                      {loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-800">Security Settings</h2>
                    <p className="text-slate-500 text-sm">Ensure your account stays secure.</p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                      {loading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                      Update Password
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default Profile;

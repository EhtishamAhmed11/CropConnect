import React, { useState, useEffect } from "react";
import { userAPI } from '../../api/usersAPI';
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";

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
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2 px-1 ${
              activeTab === "profile"
                ? "border-b-2 border-primary text-primary font-semibold"
                : "text-gray-600"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-2 px-1 ${
              activeTab === "password"
                ? "border-b-2 border-primary text-primary font-semibold"
                : "text-gray-600"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow">
            <div className="mb-6">
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-semibold">{user?.username}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold capitalize">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <Input
                label="Full Name"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                required
              />
              <Input
                label="Phone Number"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleProfileChange}
              />
              <Button type="submit" loading={loading}>
                Update Profile
              </Button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="bg-white p-6 rounded shadow">
            <form onSubmit={handlePasswordSubmit}>
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              <Button type="submit" loading={loading}>
                Change Password
              </Button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleColor = (role) => {
    const colors = {
      admin: "bg-purple-100 text-purple-700",
      government_policy_maker: "bg-emerald-100 text-emerald-700",
      ngo_coordinator: "bg-blue-100 text-blue-700",
      distributor: "bg-orange-100 text-orange-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 h-16">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br  rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white text-xl font-bold">🌾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CropConnect</h1>
              <p className="text-xs text-gray-500 -mt-1">
                Agricultural Management
              </p>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Quick Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-48"
              />
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.fullName || "User"}
                    </p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleColor(
                        user?.role
                      )}`}
                    >
                      {user?.role?.replace(/_/g, " ") || "Role"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

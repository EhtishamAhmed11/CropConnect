import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      roles: ["all"],
      color: "emerald",
    },
    {
      path: "/production/overview",
      label: "Production Data",
      icon: "🌾",
      roles: ["admin", "government_policy_maker"],
      color: "blue",
    },
    {
      path: "/surplus-deficit",
      label: "Surplus/Deficit",
      icon: "📈",
      roles: ["admin", "government_policy_maker", "ngo_coordinator"],
      color: "purple",
    },
    {
      path: "/alerts",
      label: "Alerts",
      icon: "🔔",
      roles: ["all"],
      color: "orange",
    },
    {
      path: "/reports",
      label: "Reports",
      icon: "📄",
      roles: ["admin", "government_policy_maker", "ngo_coordinator"],
      color: "indigo",
    },
    {
      path: "/gis",
      label: "Maps",
      icon: "🗺️",
      roles: [
        "admin",
        "government_policy_maker",
        "ngo_coordinator",
        "distributor",
      ],
      color: "teal",
    },
    {
      path: "/admin",
      label: "Admin Panel",
      icon: "⚙️",
      roles: ["admin"],
      color: "red",
    },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(user?.role)
  );

  const getActiveClasses = (item) => {
    if (isActive(item.path)) {
      const colors = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-500",
        blue: "bg-blue-50 text-blue-700 border-blue-500",
        purple: "bg-purple-50 text-purple-700 border-purple-500",
        orange: "bg-orange-50 text-orange-700 border-orange-500",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-500",
        teal: "bg-teal-50 text-teal-700 border-teal-500",
        red: "bg-red-50 text-red-700 border-red-500",
      };
      return colors[item.color] || colors.emerald;
    }
    return "text-gray-600 hover:bg-gray-50 border-transparent";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-4">
        {/* Navigation Title */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
          Navigation
        </p>

        {/* Menu Items */}
        <nav className="space-y-1">
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg 
                transition-all duration-200 font-medium text-sm
                border-l-4 hover:translate-x-1
                ${getActiveClasses(item)}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {isActive(item.path) && (
                <span className="ml-auto text-xs">●</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Stats - Optional Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Quick Stats
          </p>
          <div className="space-y-2">
            <div className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">
                Active Regions
              </p>
              <p className="text-lg font-bold text-emerald-900">24</p>
            </div>
            <div className="px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-600 font-medium">
                Pending Alerts
              </p>
              <p className="text-lg font-bold text-orange-900">8</p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 px-3">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <p className="text-lg mb-1">💡</p>
            <p className="text-sm font-semibold mb-1">Need Help?</p>
            <p className="text-xs opacity-90 mb-3">
              Check our documentation for guides
            </p>
            <button className="w-full bg-white text-emerald-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

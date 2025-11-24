import { Link } from "react-router-dom";
import { ShieldCheck, Users, ArrowRight } from "lucide-react";

export default function AdminOverview() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <p className="text-gray-600 mb-8">
        Access core administrative tools below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <Link
          to="/admin/system-health"
          className="group bg-white shadow p-6 rounded-2xl border hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <ShieldCheck className="w-10 h-10 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold mb-1">System Health</h2>
              <p className="text-gray-500 text-sm">
                Monitor backend status, uptime, and service performance.
              </p>
            </div>
          </div>

          <ArrowRight className="group-hover:translate-x-1 transition" />
        </Link>

        {/* User Management */}
        <Link
          to="/admin/user-management"
          className="group bg-white shadow p-6 rounded-2xl border hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold mb-1">User Management</h2>
              <p className="text-gray-500 text-sm">
                Manage user roles, access, and account permissions.
              </p>
            </div>
          </div>

          <ArrowRight className="group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  );
}

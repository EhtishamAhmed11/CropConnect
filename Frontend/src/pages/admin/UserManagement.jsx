import React, { useState, useEffect } from "react";
import { adminAPI } from "../../api/adminAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Table from "../../components/common/Table";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loading from "../../components/common/Loading";
import { UserPlus, Search, Filter, Trash2, Shield, UserCheck, UserX, X } from "lucide-react";

const UserManagement = () => {
  const { showSuccess, showError } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    isActive: "",
    search: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers({
        page,
        limit: 20,
        ...filters,
      });
      setUsers(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      showError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminAPI.deleteUser(id);
        showSuccess("User deleted");
        fetchUsers();
      } catch (error) {
        showError("Failed to delete user");
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminAPI.updateUser(id, { isActive: !currentStatus });
      showSuccess(`User ${!currentStatus ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (error) {
      showError("Failed to update user");
    }
  };

  const columns = [
    {
      header: "User Profile",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {row.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.username}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { header: "Full Name", accessor: "fullName", className: "font-medium text-slate-600" },
    {
      header: "Role Permission",
      render: (row) => (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 uppercase w-fit">
          <Shield size={12} />
          {row.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Account Status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${row.isActive
            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
            : "bg-red-50 text-red-600 border-red-100"
            }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Quick Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row._id, row.isActive);
            }}
            title={row.isActive ? "Deactivate User" : "Activate User"}
            className={`p-2 rounded-lg transition-colors ${row.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {row.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            title="Delete User"
            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading && page === 1)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-indigo-500 font-bold uppercase tracking-wider text-sm mb-1">Access Control</p>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-slate-800">User Management</h1>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{users.length} Users</span>
            </div>
          </div>

          <Button onClick={() => setShowCreateModal(true)} className="shadow-lg shadow-indigo-200">
            <UserPlus size={18} className="mr-2" />
            Create New User
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by username, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-none font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border-none font-bold text-slate-600 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="government_policy_maker">Policy Maker</option>
              <option value="ngo_coordinator">NGO Coordinator</option>
              <option value="distributor">Distributor</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border-none font-bold text-slate-600 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <Table columns={columns} data={users} />
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchUsers();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Extracted & Styled Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    role: "government_policy_maker",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminAPI.createUser(formData);
      showSuccess("User created successfully");
      onSuccess();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Outfit']">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn scale-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Add New User</h2>
          <p className="text-slate-500">Create a new account and assign permissions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Username" name="username" value={formData.username} onChange={handleChange} required placeholder="e.g. johndoe" />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" />
          <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
          <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+92..." />
          <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Role Permission</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="government_policy_maker">Policy Maker</option>
              <option value="ngo_coordinator">NGO Coordinator</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="submit" loading={loading} fullWidth className="py-3 text-lg shadow-lg shadow-indigo-200">
              Create Account
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;

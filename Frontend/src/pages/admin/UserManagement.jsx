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
    { header: "Username", accessor: "username" },
    { header: "Email", accessor: "email" },
    { header: "Full Name", accessor: "fullName" },
    {
      header: "Role",
      render: (row) => (
        <span className="text-sm capitalize">
          {row.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row._id, row.isActive);
            }}
            className="text-primary hover:underline text-sm"
          >
            {row.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="text-red-500 hover:underline text-sm"
          >
            Delete
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setShowCreateModal(true)}>Create User</Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Search"
              name="search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Username, email, or name"
            />
            <Select
              label="Role"
              name="role"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              options={[
                { value: "", label: "All Roles" },
                { value: "admin", label: "Admin" },
                { value: "government_policy_maker", label: "Policy Maker" },
                { value: "ngo_coordinator", label: "NGO Coordinator" },
                { value: "distributor", label: "Distributor" },
              ]}
            />
            <Select
              label="Status"
              name="isActive"
              value={filters.isActive}
              onChange={(e) =>
                setFilters({ ...filters, isActive: e.target.value })
              }
              options={[
                { value: "", label: "All Status" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded shadow">
          <Table columns={columns} data={users} />
          <div className="p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: "admin", label: "Admin" },
              { value: "government_policy_maker", label: "Policy Maker" },
              { value: "ngo_coordinator", label: "NGO Coordinator" },
              { value: "distributor", label: "Distributor" },
            ]}
            required
          />
          <div className="flex space-x-2 mt-4">
            <Button type="submit" loading={loading}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;

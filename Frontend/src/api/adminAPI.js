import api from "./axios";

export const adminAPI = {
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboardStats: () => api.get("/admin/dashboard"),
  getSystemHealth: () => api.get("/admin/health"),
  getIngestionLogs: (params) => api.get("/admin/ingestion-logs", { params }),
  getSystemSettings: (params) => api.get("/admin/settings", { params }),
  updateSystemSetting: (key, value) =>
    api.put(`/admin/settings/${key}`, { value }),
};

import api from "./axios";

export const alertAPI = {
  getAll: (params) => api.get("/alerts", { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post("/alerts", data),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  resolve: (id, data) => api.put(`/alerts/${id}/resolve`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
  getUnreadCount: () => api.get("/alerts/unread/count"),
  getActive: (params) => api.get("/alerts/active", { params }),
  getCritical: (params) => api.get("/alerts/critical", { params }),
  getSummary: () => api.get("/alerts/summary"),
};

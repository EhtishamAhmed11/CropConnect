import api from "./axios";

export const reportAPI = {
  getAll: (params) => api.get("/reports", { params }),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post("/reports/generate", data),
  generateProductionAnalysis: (data) =>
    api.post("/reports/production-analysis", data),
  generateSurplusDeficit: (data) => api.post("/reports/surplus-deficit", data),
  delete: (id) => api.delete(`/reports/${id}`),
  getScheduled: (params) => api.get("/reports/scheduled", { params }),
  updateSchedule: (id, data) => api.put(`/reports/${id}/schedule`, data),
};

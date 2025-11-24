import api from "./axios";

export const productionAPI = {
  getAll: (params) => api.get("/production", { params }),
  getById: (id) => api.get(`/production/${id}`),
  create: (data) => api.post("/production", data),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
  getSummary: (params) => api.get("/production/summary", { params }),
  getTrends: (params) => api.get("/production/trends", { params }),
  getByCrop: (params) => api.get("/production/by-crop", { params }),
  getByProvince: (params) => api.get("/production/by-province", { params }),
  getTopDistricts: (params) => api.get("/production/top-districts", { params }),
};

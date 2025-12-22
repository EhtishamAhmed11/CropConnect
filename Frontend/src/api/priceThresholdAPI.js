// frontend/src/api/priceThresholdAPI.js
import axios from "./axios";

export const priceThresholdAPI = {
    // Get all price thresholds for current user
    getAll: (params = {}) => axios.get("/price-thresholds", { params }),

    // Get single threshold by ID
    getById: (id) => axios.get(`/price-thresholds/${id}`),

    // Create new price threshold
    create: (data) => axios.post("/price-thresholds", data),

    // Update threshold
    update: (id, data) => axios.put(`/price-thresholds/${id}`, data),

    // Toggle active/inactive
    toggle: (id) => axios.put(`/price-thresholds/${id}/toggle`),

    // Delete threshold
    delete: (id) => axios.delete(`/price-thresholds/${id}`),

    // Manually check a threshold
    check: (id) => axios.post(`/price-thresholds/${id}/check`),

    // Admin: Check all thresholds
    checkAll: () => axios.post("/price-thresholds/check-all"),
};

export default priceThresholdAPI;

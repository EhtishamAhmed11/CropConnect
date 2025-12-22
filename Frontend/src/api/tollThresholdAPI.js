// frontend/src/api/tollThresholdAPI.js
import axios from "./axios";

export const tollThresholdAPI = {
    // Get all toll thresholds for current user
    getAll: (params = {}) => axios.get("/toll-thresholds", { params }),

    // Create new toll threshold
    create: (data) => axios.post("/toll-thresholds", data),

    // Toggle active/inactive
    toggle: (id) => axios.put(`/toll-thresholds/${id}/toggle`),

    // Delete threshold
    delete: (id) => axios.delete(`/toll-thresholds/${id}`),

    // Get all toll rates
    getRates: (params = {}) => axios.get("/toll-thresholds/rates", { params }),

    // Admin: Check all thresholds
    checkAll: () => axios.post("/toll-thresholds/check-all"),
};

export default tollThresholdAPI;

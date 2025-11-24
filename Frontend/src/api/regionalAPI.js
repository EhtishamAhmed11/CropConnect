// src/api/regionalAPI.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const regionalAPI = {
  compareRegions: (data) => API.post("/regional/compare", data),
  getRegionalPerformance: (regionType, regionCode, params = {}) =>
    API.get(`/regional/performance/${regionType}/${regionCode}`, { params }),
  getDistrictRankings: (params) =>
    API.get("/regional/district-rankings", { params }),
  getProvincialSummary: (params) =>
    API.get("/regional/provincial-summary", { params }),
  getYearOverYearComparison: (regionType, regionCode, params = {}) =>
    API.get(`/regional/year-comparison/${regionType}/${regionCode}`, {
      params,
    }),
    
};

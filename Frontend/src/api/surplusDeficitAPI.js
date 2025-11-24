import api from "./axios";

export const surplusDeficitAPI = {
  calculate: (data) => api.post("/surplus-deficit/calculate", data),
  getAll: (params) => api.get("/surplus-deficit", { params }),
  getSummary: (params) => api.get("/surplus-deficit/summary", { params }),
  getDeficitRegions: (params) =>
    api.get("/surplus-deficit/deficit-regions", { params }),
  getSurplusRegions: (params) =>
    api.get("/surplus-deficit/surplus-regions", { params }),
  getRedistributionSuggestions: (params) =>
    api.get("/surplus-deficit/redistribution-suggestions", { params }),
};

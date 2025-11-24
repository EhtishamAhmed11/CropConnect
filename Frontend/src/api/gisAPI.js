// src/api/gisAPI.js
import api from "./axios"; // your configured axios instance

export const gisAPI = {
  getProvinces: () => api.get("/gis/provinces"),
  getProvinceByCode: (code) => api.get(`/gis/provinces/${code}`),
  getDistricts: (params) => api.get("/gis/districts", { params }),
  getDistrictByCode: (code) => api.get(`/gis/districts/${code}`),
  getProductionMapData: (params) => api.get("/gis/production-map", { params }),
  getSurplusDeficitMapData: (params) => api.get("/gis/surplus-deficit-map", { params }),
  getProductionHeatmap: (params) => api.get("/gis/production-heatmap", { params }),
  getRegionsNearby: (params) => api.get("/gis/regions-nearby", { params }),
  getProvincesGeoJSON: () => api.get("/gis/geojson/provinces"),
  getDistrictsGeoJSON: (params) => api.get("/gis/geojson/districts", { params }),
};

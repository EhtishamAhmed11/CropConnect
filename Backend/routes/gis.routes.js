// backend/routes/gis.routes.js
import { Router } from "express";
const router = Router();
import {
  getProvinces,
  getProvinceByCode,
  getDistricts,
  getDistrictByCode,
  getProductionMapData,
  getSurplusDeficitMapData,
  getProductionHeatmap,
  getRegionsNearby,
  getProvincesGeoJSON,
  getDistrictsGeoJSON,
  getRoute,
  getOptimizedRoutes,
} from "../controllers/gis.controller.js";

// All routes are public (no authentication required for map data)

// Geographic data
router.get("/provinces", getProvinces);
router.get("/provinces/:code", getProvinceByCode);
router.get("/districts", getDistricts);
router.get("/districts/:code", getDistrictByCode);

// Map visualization data
router.get("/production-map", getProductionMapData);
router.get("/surplus-deficit-map", getSurplusDeficitMapData);
router.get("/production-heatmap", getProductionHeatmap);

// Proximity and spatial queries
router.get("/regions-nearby", getRegionsNearby);
router.get("/routes", getRoute);

// Optimized distribution routes (with toll costs)
router.get("/optimize-routes", getOptimizedRoutes);

// GeoJSON endpoints
router.get("/geojson/provinces", getProvincesGeoJSON);
router.get("/geojson/districts", getDistrictsGeoJSON);

export default router;

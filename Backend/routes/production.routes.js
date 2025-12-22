import express from "express";
import {
  createProductionData,
  deleteProductionData,
  getCropTypes,
  getProductionByCrop,
  getProductionById,
  getProductionByProvince,
  getProductionData,
  getProductionMetadata,
  getProductionSummary,
  getProductionTrends,
  getTopDistricts,
  updateProductionData,
} from "../controllers/production.controller.js";
import { authorize, protect } from "../middlewares/auth.js";
const router = express.Router();

router.get("/", getProductionData);
router.get("/summary", getProductionSummary);
router.get("/trends", getProductionTrends);
router.get("/by-crop", getProductionByCrop);
router.get("/by-province", getProductionByProvince);
router.get("/top-districts", getTopDistricts);
router.get("/crop-types", getCropTypes);
router.get("/metadata", getProductionMetadata);
router.get("/:id", getProductionById);

// Protected routes (Admin only)
router.post("/", protect, authorize("admin"), createProductionData);
router.put("/:id", protect, authorize("admin"), updateProductionData);
router.delete("/:id", protect, authorize("admin"), deleteProductionData);
export default router;

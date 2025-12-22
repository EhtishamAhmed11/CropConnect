// backend/routes/priceThreshold.routes.js
import { Router } from "express";
import {
    getThresholds,
    getThresholdById,
    createThreshold,
    updateThreshold,
    toggleThreshold,
    deleteThreshold,
    checkThreshold,
    checkAllThresholds,
} from "../controllers/priceThreshold.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = Router();

// All routes require authentication
router.use(protect);

// CRUD operations
router.get("/", getThresholds);
router.get("/:id", getThresholdById);
router.post("/", createThreshold);
router.put("/:id", updateThreshold);
router.put("/:id/toggle", toggleThreshold);
router.delete("/:id", deleteThreshold);

// Manual check triggers
router.post("/:id/check", checkThreshold);
router.post("/check-all", authorize("admin"), checkAllThresholds);

export default router;

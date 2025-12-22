// backend/routes/tollThreshold.routes.js
import { Router } from "express";
import {
    getTollThresholds,
    createTollThreshold,
    toggleTollThreshold,
    deleteTollThreshold,
    getTollRates,
    checkAllTollThresholds,
} from "../controllers/tollThreshold.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = Router();

// All routes require authentication
router.use(protect);

// Get toll rates (for creating thresholds)
router.get("/rates", getTollRates);

// CRUD operations
router.get("/", getTollThresholds);
router.post("/", createTollThreshold);
router.put("/:id/toggle", toggleTollThreshold);
router.delete("/:id", deleteTollThreshold);

// Manual check triggers (Admin only)
router.post("/check-all", authorize("admin"), checkAllTollThresholds);

export default router;

// backend/routes/alert.routes.js
import { Router } from "express";
const router = Router();
import {
  getAlerts,
  getAlertById,
  getUnreadAlertsCount,
  getActiveAlerts,
  getCriticalAlerts,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  getAlertsSummary,
} from "../controllers/alert.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

// All routes require authentication
router.use(protect);

// Get routes
router.get("/", getAlerts);
router.get("/summary", getAlertsSummary);
router.get("/unread/count", getUnreadAlertsCount);
router.get("/active", getActiveAlerts);
router.get("/critical", getCriticalAlerts);
router.get("/:id", getAlertById);

// Create alert (Admin only)
router.post("/", authorize("admin"), createAlert);

// Acknowledge alert (any authenticated user)
router.put("/:id/acknowledge", acknowledgeAlert);

// Resolve alert (Admin and Policy Makers)
router.put(
  "/:id/resolve",
  authorize("admin", "government_policy_maker"),
  resolveAlert
);

// Delete alert (Admin only)
router.delete("/:id", authorize("admin"), deleteAlert);

export default router;

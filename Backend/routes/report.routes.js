// backend/routes/report.routes.js
import { Router } from "express";
const router = Router();
import {
  getReports,
  getReportById,
  generateReport,
  generateProductionAnalysisReport,
  generateSurplusDeficitReport,
  deleteReport,
  getScheduledReports,
  updateScheduledReport,
} from "../controllers/report.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

// All routes require authentication
router.use(protect);

// Get all reports (with pagination)
router.get("/", getReports);

// Get scheduled reports
router.get("/scheduled", getScheduledReports);

// Get single report
router.get("/:id", getReportById);

// Generate reports
router.post("/generate", generateReport);
router.post(
  "/production-analysis",
  authorize("admin", "government_policy_maker"),
  generateProductionAnalysisReport
);
router.post(
  "/surplus-deficit",
  authorize("admin", "government_policy_maker", "ngo_coordinator"),
  generateSurplusDeficitReport
);

// Update scheduled report
router.put("/:id/schedule", updateScheduledReport);

// Delete report
router.delete("/:id", deleteReport);

export default router;

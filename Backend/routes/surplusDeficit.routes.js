// backend/routes/surplusDeficit.routes.js
import { Router } from "express";
const router = Router();
import {
  calculateSurplusDeficitAnalysis,
  getSurplusDeficitRecords,
  getSurplusDeficitSummary,
  getDeficitRegions,
  getSurplusRegions,
  getRedistributionSuggestions,
} from "../controllers/surplusDeficit.controller.js";
import { authorize,protect} from '../middlewares/auth.js'

// Public routes
router.get("/", getSurplusDeficitRecords);
router.get("/summary", getSurplusDeficitSummary);
router.get("/deficit-regions", getDeficitRegions);
router.get("/surplus-regions", getSurplusRegions);

// Protected routes
router.post(
  "/calculate",
  protect,
  authorize("admin", "government_policy_maker", "ngo_coordinator"),
  calculateSurplusDeficitAnalysis
);

router.get(
  "/redistribution-suggestions",
  protect,
  authorize(
    "admin",
    "government_policy_maker",
    "ngo_coordinator",
    "distributor"
  ),
  getRedistributionSuggestions
);

export default router;

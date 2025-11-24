import { Router } from "express";
const router = Router();
import {
  compareRegions,
  getRegionalPerformance,
  getDistrictRankings,
  getProvincialSummary,
  getYearOverYearComparison,
} from "../controllers/regional.controller.js";

// All regional routes are public
router.post("/compare", compareRegions);
router.get("/performance/:regionType/:regionCode", getRegionalPerformance);
router.get("/district-rankings", getDistrictRankings);
router.get("/provincial-summary", getProvincialSummary);
router.get(
  "/year-comparison/:regionType/:regionCode",
  getYearOverYearComparison
);

export default router;

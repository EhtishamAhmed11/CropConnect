// Backend/routes/prediction.routes.js
import express from "express";
import * as predictionController from "../controllers/prediction.controller.js";

const router = express.Router();

// Get forecast data for a crop and region
router.get("/forecast", predictionController.getForecastData);

// Get combined historical + forecast timeline
router.get("/timeline", predictionController.getTimelineData);

// Get model performance metrics
router.get("/performance", predictionController.getModelPerformance);

// Get regional comparison for a specific year
router.get("/regional-comparison", predictionController.getRegionalComparison);

// Get prediction summary statistics
router.get("/summary", predictionController.getPredictionSummary);

export default router;

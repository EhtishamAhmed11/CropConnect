import express from "express";
import * as marketController from "../controllers/market.controller.js";

const router = express.Router();

router.get("/prices/latest", marketController.getLatestPrices);
router.get("/prices/history", marketController.getPriceHistory);
router.get("/highlights", marketController.getMarketHighlights);
router.post("/prices", marketController.addMarketPrice);
router.get("/forecast", marketController.getPriceForecast);
router.get("/forecast/district/:districtId", marketController.getDistrictForecasts);
export default router;

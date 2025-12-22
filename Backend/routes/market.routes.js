import express from "express";
import * as marketController from "../controllers/market.controller.js";

const router = express.Router();

router.get("/prices/latest", marketController.getLatestPrices);
router.get("/prices/history", marketController.getPriceHistory);
router.get("/highlights", marketController.getMarketHighlights);
router.post("/prices", marketController.addMarketPrice);

export default router;

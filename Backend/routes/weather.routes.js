import express from "express";
import * as weatherController from "../controllers/weather.controller.js";

const router = express.Router();

router.get("/district/:identifier", weatherController.getDistrictWeather);
router.get("/history/:identifier", weatherController.getDistrictWeatherHistory);
router.post("/update-all", weatherController.updateAllWeather);
router.post("/update/:id", weatherController.updateWeather);

export default router;

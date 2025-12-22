import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDb from "./connection/db.connection.js";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import productionRoutes from "./routes/production.routes.js";
import surplusDeficitRoutes from "./routes/surplusDeficit.routes.js";
import reportRoutes from "./routes/report.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import gisRoutes from "./routes/gis.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import regionalRoutes from "./routes/regional.routes.js";
import seedRoutes from "./routes/seed.routes.js";
import weatherRoutes from "./routes/weather.routes.js";
import marketRoutes from "./routes/market.routes.js";
import priceThresholdRoutes from "./routes/priceThreshold.routes.js";
import tollThresholdRoutes from "./routes/tollThreshold.routes.js";
import setupScheduler from "./scheduler.js";
import runAllSeeds from "./seeds/runAllSeeds.js";
import seedProvinces from "./seeds/01-provinces.seed.js";
import importAllCrops from "./scripts/import/importAll.js";
import seedMarketData from "./seeds/market.seed.js";
import seedWeather from "./seeds/05-weather.seed.js";
import { fixCropTypes } from "./scripts/fixCropTypes.js";
import { fixGeoReferences } from "./scripts/fixGeoReferences.js";
import seedTollRates from "./seeds/tollRates.seed.js";
import seed2024Data from "./seeds/2024_25_data.seed.js";

const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/surplus-deficit", surplusDeficitRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/gis", gisRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/regional", regionalRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/price-thresholds", priceThresholdRoutes);
app.use("/api/toll-thresholds", tollThresholdRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    connectDb();
    // runAllSeeds()
    // importAllCrops()
    // seedWeather()
    // seedMarketData()
    // fixCropTypes()
    // fixGeoReferences()
    // seedTollRates()
    // seed2024Data()
    console.log("Server started on port 3000");
    setupScheduler();
  });
}
app.use(errorHandler);

export default app;

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
import runAllSeeds from "./seeds/runAllSeeds.js";
import importAllCrops from "./scripts/import/importAll.js";
import importRice from "./scripts/import/importRice.js";
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.listen(PORT, () => {
  connectDb();
  // runAllSeeds();
  // importAllCrops()
  // importRice()
  console.log("Server started on port 3000");
});
app.use(errorHandler);

export default app;

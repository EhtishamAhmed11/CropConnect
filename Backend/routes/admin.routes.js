// backend/routes/admin.routes.js
import { Router } from "express";
const router = Router();
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  getIngestionLogs,
  getSystemSettings,
  updateSystemSetting,
  getSystemHealth,
} from "../controllers/admin.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Data ingestion logs
router.get("/ingestion-logs", getIngestionLogs);

// System settings
router.get("/settings", getSystemSettings);
router.put("/settings/:key", updateSystemSetting);

// System health
router.get("/health", getSystemHealth);

export default router;

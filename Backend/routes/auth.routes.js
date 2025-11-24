// backend/routes/auth.routes.js
import { Router } from "express";
const router = Router();
import {
  register,
  login,
  getMe,
  logout,
//   verifyEmail,
//   resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validators.js";

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
// router.get("/verify-email/:token", verifyEmail);
// router.post("/resend-verification", resendVerification);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.put("/reset-password/:token", validateResetPassword, resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/refresh-token", protect, refreshToken);

export default router;

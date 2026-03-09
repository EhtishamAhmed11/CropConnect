// backend/controllers/auth.controller.js
import User from "../models/user.model.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      role,
      organization,
    } = req.body;

    // Validation
    if (!username || !email || !password || !fullName) {
      return ApiResponse.error(
        res,
        "Username, email, password, and full name are required",
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponse.error(res, "Invalid email format", 400);
    }

    // Validate password length
    if (password.length < 8) {
      return ApiResponse.error(
        res,
        "Password must be at least 8 characters long",
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return ApiResponse.error(
        res,
        "User with this email or username already exists",
        400
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: role || "government_policy_maker", // Default role
      organization,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user.email, verificationToken).catch(err =>
      console.error("Verification email failed:", err.message)
    );

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    };

    return ApiResponse.created(
      res,
      {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      "User registered successfully. Please check your email to verify your account."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return ApiResponse.error(res, "Email and password are required", 400);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return ApiResponse.error(
        res,
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return ApiResponse.error(
        res,
        `Account is locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`,
        423
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        return ApiResponse.error(
          res,
          "Account locked due to multiple failed login attempts. Try again in 30 minutes.",
          423
        );
      }

      await user.save();
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      organization: user.organization,
      preferences: user.preferences,
    };

    return ApiResponse.success(
      res,
      {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();

    return ApiResponse.success(res, user, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    // Note: With JWT, logout is typically handled client-side by removing the token
    // If using refresh tokens or token blacklisting, handle that here

    return ApiResponse.success(res, null, "Logout successful");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return ApiResponse.error(
        res,
        "Invalid or expired verification token",
        400
      );
    }

    // Verify user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return ApiResponse.success(
      res,
      null,
      "Email verified successfully. You can now login."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.error(res, "Email is required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    if (user.isVerified) {
      return ApiResponse.error(res, "Email is already verified", 400);
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    return ApiResponse.success(
      res,
      null,
      "Verification email sent successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - Send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.error(res, "Email is required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return ApiResponse.success(
        res,
        null,
        "If an account with that email exists, a password reset link has been sent."
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpiry = resetPasswordExpiry;
    await user.save();

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return ApiResponse.success(
      res,
      null,
      "If an account with that email exists, a password reset link has been sent."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return ApiResponse.error(res, "Password is required", 400);
    }

    if (password.length < 8) {
      return ApiResponse.error(
        res,
        "Password must be at least 8 characters long",
        400
      );
    }

    // Hash the token from URL
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return ApiResponse.error(
        res,
        "Invalid or expired password reset token",
        400
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    // Reset login attempts if any
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    return ApiResponse.success(
      res,
      null,
      "Password reset successful. You can now login with your new password."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Private
 */
export const refreshToken = async (req, res, next) => {
  try {
    // Verify user still exists and is active
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return ApiResponse.error(res, "User not found or inactive", 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    return ApiResponse.success(res, { accessToken, refreshToken: newRefreshToken }, "Token refreshed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "refresh_secret_key", {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });

  return { accessToken, refreshToken };
};

/**
 * Helper function to send verification email (implement with nodemailer)
 */
// const sendVerificationEmail = async (email, token) => {
//   // TODO: Implement email sending
//   const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
//   // Send email with verificationUrl
// };

/**
 * Helper function to send password reset email (implement with nodemailer)
 */
// const sendPasswordResetEmail = async (email, resetUrl) => {
//   // TODO: Implement email sending
//   // Send email with resetUrl
// };

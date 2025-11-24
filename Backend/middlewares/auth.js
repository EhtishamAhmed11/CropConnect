// backend/middleware/auth.js
import jwt from"jsonwebtoken";
import User from"../models/user.model.js";
import ApiResponse from"../utils/apiResponse.js";

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return ApiResponse.error(res, "Not authorized to access this route", 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return ApiResponse.error(res, "User not found", 404);
      }

      if (!req.user.isActive) {
        return ApiResponse.error(res, "User account is deactivated", 403);
      }

      next();
    } catch (error) {
      return ApiResponse.error(res, "Not authorized to access this route", 401);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Grant access to specific roles
 * Usage: authorize('admin', 'government_policy_maker')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};

/**
 * Optional authentication - doesn't block if no token
 * Useful for public endpoints that show different data when authenticated
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
      } catch (error) {
        // Token invalid, continue as unauthenticated
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

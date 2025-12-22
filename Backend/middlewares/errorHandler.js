import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error("Error: %O", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user ? req.user._id : "anonymous",
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
    const field = Object.keys(err.keyPattern)[0];
    return res.status(statusCode).json({
      success: false,
      message,
      errors: [`${field} already exists`],
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;

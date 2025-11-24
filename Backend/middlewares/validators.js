import ApiResponse from "../utils/apiResponse.js";
export function validateRegister(req, res, next) {
  const { username, email, password, fullName } = req.body;
  const errors = [];

  // Username validation
  if (!username) {
    errors.push("Username is required");
  } else if (username.length < 3 || username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Email validation
  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Full name validation
  if (!fullName) {
    errors.push("Full name is required");
  } else if (fullName.length < 2) {
    errors.push("Full name must be at least 2 characters long");
  }

  // Phone number validation (optional)
  if (req.body.phoneNumber) {
    if (!/^[0-9]{10,15}$/.test(req.body.phoneNumber)) {
      errors.push("Phone number must be between 10 and 15 digits");
    }
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, "Validation failed", 400, errors);
  }

  next();
}

/**
 * Validate login input
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, "Validation failed", 400, errors);
  }

  next();
}

/**
 * Validate forgot password input
 */
export function validateForgotPassword(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, "Email is required", 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ApiResponse.error(res, "Invalid email format", 400);
  }

  next();
}

/**
 * Validate reset password input
 */
export function validateResetPassword(req, res, next) {
  const { password } = req.body;
  const errors = [];

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, "Validation failed", 400, errors);
  }

  next();
}

/**
 * Validate change password input
 */
export function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push("Current password is required");
  }

  if (!newPassword) {
    errors.push("New password is required");
  } else if (newPassword.length < 8) {
    errors.push("New password must be at least 8 characters long");
  } else if (!/(?=.*[a-z])/.test(newPassword)) {
    errors.push("New password must contain at least one lowercase letter");
  } else if (!/(?=.*[A-Z])/.test(newPassword)) {
    errors.push("New password must contain at least one uppercase letter");
  } else if (!/(?=.*\d)/.test(newPassword)) {
    errors.push("New password must contain at least one number");
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push("New password must be different from current password");
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, "Validation failed", 400, errors);
  }

  next();
}

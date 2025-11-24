// src/utils/constants.js

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  POLICY_MAKER: "government_policy_maker",
  NGO: "ngo_coordinator",
  DISTRIBUTOR: "distributor",
};

// Alert Types
export const ALERT_TYPES = {
  DEFICIT_CRITICAL: "deficit_critical",
  SURPLUS_AVAILABLE: "surplus_available",
  PRODUCTION_DROP: "production_drop",
  WEATHER_WARNING: "weather_warning",
  SYSTEM: "system",
};

// Alert Severity
export const ALERT_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Alert Status
export const ALERT_STATUS = {
  ACTIVE: "active",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
};

// Report Types
export const REPORT_TYPES = {
  PRODUCTION_ANALYSIS: "production_analysis",
  SURPLUS_DEFICIT: "surplus_deficit",
  REGIONAL_COMPARISON: "regional_comparison",
  TREND_ANALYSIS: "trend_analysis",
  CUSTOM: "custom",
};

// Report Formats
export const REPORT_FORMATS = {
  PDF: "pdf",
  EXCEL: "excel",
  CSV: "csv",
  JSON: "json",
};

// Report Status
export const REPORT_STATUS = {
  PENDING: "pending",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Surplus/Deficit Status
export const SURPLUS_STATUS = {
  SURPLUS: "surplus",
  DEFICIT: "deficit",
  BALANCED: "balanced",
};

// Severity Levels
export const SEVERITY_LEVELS = {
  CRITICAL: "critical",
  MODERATE: "moderate",
  MILD: "mild",
};

// Priority Levels
export const PRIORITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Data Levels
export const DATA_LEVELS = {
  NATIONAL: "national",
  PROVINCIAL: "provincial",
  DISTRICT: "district",
};

// Crop Categories
export const CROP_CATEGORIES = {
  CEREAL: "cereal",
  VEGETABLE: "vegetable",
  FRUIT: "fruit",
  PULSE: "pulse",
  CASH_CROP: "cash_crop",
};

// Provinces (Pakistan)
export const PROVINCES = [
  { code: "PUNJAB", name: "Punjab" },
  { code: "SINDH", name: "Sindh" },
  { code: "KPK", name: "Khyber Pakhtunkhwa" },
  { code: "BALOCHISTAN", name: "Balochistan" },
  { code: "GB", name: "Gilgit-Baltistan" },
  { code: "AJK", name: "Azad Jammu & Kashmir" },
];

// Major Crops
export const MAJOR_CROPS = [
  { code: "WHEAT", name: "Wheat" },
  { code: "RICE", name: "Rice" },
  { code: "MAIZE", name: "Maize" },
  { code: "SUGARCANE", name: "Sugarcane" },
  { code: "COTTON", name: "Cotton" },
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_WITH_TIME: "MMM dd, yyyy HH:mm",
  API: "yyyy-MM-dd",
  FULL: "MMMM dd, yyyy",
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: "#3b82f6",
  SUCCESS: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#06b6d4",
  PURPLE: "#8b5cf6",
  PINK: "#ec4899",
};

// Status Colors
export const STATUS_COLORS = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  default: "bg-gray-100 text-gray-800",
};

// Severity Badge Colors
export const SEVERITY_BADGE_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  mild: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
  PREFERENCES: "preferences",
};

export default {
  USER_ROLES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ALERT_STATUS,
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_STATUS,
  SURPLUS_STATUS,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  DATA_LEVELS,
  CROP_CATEGORIES,
  PROVINCES,
  MAJOR_CROPS,
  PAGINATION,
  DATE_FORMATS,
  CHART_COLORS,
  STATUS_COLORS,
  SEVERITY_BADGE_COLORS,
  STORAGE_KEYS,
};

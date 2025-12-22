import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  loading = false,
  className = "",
  title = "", // For tooltip and accessibility
}) => {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 focus:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 focus:ring-red-500",
  };
  const widthClass = fullWidth ? "w-full" : "";
  const variantClass = variantClasses[variant] || variantClasses.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={title || (typeof children === "string" ? children : "")}
      className={`${baseClasses} ${variantClass} ${widthClass} ${className} disabled:cursor-not-allowed`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;

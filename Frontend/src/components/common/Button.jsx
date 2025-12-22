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
}) => {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
  };
  const widthClass = fullWidth ? "w-full" : "";
  const variantClass = variantClasses[variant] || variantClasses.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClass} ${widthClass} ${className} disabled:cursor-not-allowed`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;

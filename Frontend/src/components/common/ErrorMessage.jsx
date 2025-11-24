import React from "react";

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 my-4">
      <p className="text-red-700">{message || "An error occurred"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

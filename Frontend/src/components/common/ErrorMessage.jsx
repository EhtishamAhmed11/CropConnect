import React from "react";

const ErrorMessage = ({ message, onRetry, showRecovery = true }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-bold text-red-800 mb-1">An Error Occurred</h3>
          <p className="text-red-700 text-sm mb-3">{message || "We encountered an unexpected issue while processing your request."}</p>

          {showRecovery && (
            <div className="bg-white/50 rounded-lg p-3 border border-red-100 mb-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Suggested Resolution Steps:</p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Check your internet connection and try again.</li>
                <li>Verify that all form fields are filled correctly.</li>
                <li>If the problem persists, try refreshing the page.</li>
              </ul>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
            >
              Retry Operation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

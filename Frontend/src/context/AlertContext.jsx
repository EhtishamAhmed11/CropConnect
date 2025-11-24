import React, { createContext, useState, useContext } from "react";

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = "info") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const showSuccess = (message) => showAlert(message, "success");
  const showError = (message) => showAlert(message, "error");
  const showWarning = (message) => showAlert(message, "warning");
  const showInfo = (message) => showAlert(message, "info");

  return (
    <AlertContext.Provider
      value={{
        alerts,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeAlert,
      }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`px-4 py-3 rounded shadow-lg ${
              alert.type === "success"
                ? "bg-green-500 text-white"
                : alert.type === "error"
                ? "bg-red-500 text-white"
                : alert.type === "warning"
                ? "bg-yellow-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{alert.message}</span>
              <button
                onClick={() => removeAlert(alert.id)}
                className="ml-4 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};

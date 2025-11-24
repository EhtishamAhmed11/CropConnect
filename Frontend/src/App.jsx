import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Dashboards
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import PolicyMakerDashboard from "./pages/dashboard/PolicyMakerDashboard";
import NGODashboard from "./pages/dashboard/NGODashboard";
import DistributorDashboard from "./pages/dashboard/DistributorDashboard";

// Production
import ProductionList from "./pages/production/ProductionList";
import ProductionDetails from "./pages/production/ProductionDetails";
import ProductionAnalysis from "./pages/production/ProductionAnalysis";
import ProductionTrends from "./pages/production/ProductionTrends";

// Surplus/Deficit
import Calculate from "./pages/surplus/Calculate";
import DeficitRegions from "./pages/surplus/DeficitRegions";
import SurplusRegions from "./pages/surplus/SurplusRegions";
import Redistribution from "./pages/surplus/Redistribution";

// Alerts
import AlertList from "./pages/alerts/AlertList";

// Reports
import ReportList from "./pages/reports/ReportList";
import GenerateReport from "./pages/reports/GenerateReport";

// Admin
import UserManagement from "./pages/admin/UserManagement";
import SystemHealth from "./pages/admin/SystemHealth";

// Profile
import Profile from "./pages/profile/Profile";
import { useAuth } from "./context/AuthContext";
import SurplusDeficitOverview from "./pages/surplus/SurplusDeficitOverview";
import AdminOverview from "./pages/admin/AdminOverview";
import ProductionOverview from "./pages/production/ProductionOverview";
import MapView from "./pages/gis/MapView";
import CreateAlert from "./pages/alerts/CreateAlert";
import ReportDetails from "./pages/reports/ReportDetails";
import ReportDetailsWrapper from "./pages/reports/ReportDetailsWrapper";

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "admin") return <AdminDashboard />;
  if (user?.role === "ngo_coordinator") return <NGODashboard />;
  if (user?.role === "distributor") return <DistributorDashboard />;
  return <PolicyMakerDashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Production Routes */}
            <Route
              path="/production"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "government_policy_maker"]}
                >
                  <ProductionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "government_policy_maker"]}
                >
                  <ProductionDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/analysis"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "government_policy_maker"]}
                >
                  <ProductionAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/trends"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "government_policy_maker"]}
                >
                  <ProductionTrends />
                </ProtectedRoute>
              }
            />

            {/* Surplus/Deficit Routes */}
            <Route
              path="/surplus-deficit/calculate"
              element={
                <ProtectedRoute>
                  <Calculate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surplus-deficit/deficit-regions"
              element={
                <ProtectedRoute>
                  <DeficitRegions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surplus-deficit/surplus-regions"
              element={
                <ProtectedRoute>
                  <SurplusRegions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surplus-deficit/redistribution"
              element={
                <ProtectedRoute>
                  <Redistribution />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surplus-deficit"
              element={
                <ProtectedRoute>
                  <SurplusDeficitOverview />
                </ProtectedRoute>
              }
            />

            {/* Alert Routes */}
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts/create"
              element={
                <ProtectedRoute>
                  <CreateAlert />
                </ProtectedRoute>
              }
            />

            {/* Report Routes */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/generate"
              element={
                <ProtectedRoute>
                  <GenerateReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute>
                  <ReportDetailsWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/overview"
              element={<ProductionOverview />}
            />

            {/* Admin Routes */}
            <Route
              path="/admin/user-management"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/system-health"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SystemHealth />
                </ProtectedRoute>
              }
            />

            <Route path="/admin" element={<AdminOverview />} />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gis"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "government_policy_maker",
                    "ngo_coordinator",
                    "distributor",
                  ]}
                >
                  <MapView />
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

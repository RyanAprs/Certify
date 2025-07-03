import "./index.css";
import type React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { CertificateProvider } from "./contexts/CertificateContext";

import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IssuerDashboard from "./pages/IssuerDashboard";

const App: React.FC = () => {
  return (
    <AuthProvider>
      {/* <CertificateProvider> */}
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issuer"
              element={
                <ProtectedRoute>
                  <IssuerDashboard />
                </ProtectedRoute>
              }
            />
            {/* <Route
                path="/holder"
                element={
                  <ProtectedRoute>
                    <HolderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verifier"
                element={
                  <ProtectedRoute>
                    <VerifierDashboard />
                  </ProtectedRoute>
                }
              /> */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
      {/* </CertificateProvider> */}
    </AuthProvider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default App;

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

import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IssuerDashboard from "./pages/IssuerDashboard";
import { CertificateProvider } from "./contexts/Certification";
import HolderDashboard from "./pages/HolderDashboard";
import VerifierDashboard from "./pages/VerifierDashboard";
import Navbar from "./components/navbar";
import Registration from "./pages/Registration";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CertificateProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute>
                    <Registration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RegisteredUserRoute>
                    <Navbar />
                    <Dashboard />
                  </RegisteredUserRoute>
                }
              />
              <Route
                path="/issuer"
                element={
                  <RegisteredUserRoute>
                    <Navbar />
                    <IssuerDashboard />
                  </RegisteredUserRoute>
                }
              />
              <Route
                path="/holder"
                element={
                  <RegisteredUserRoute>
                    <Navbar />
                    <HolderDashboard />
                  </RegisteredUserRoute>
                }
              />
              <Route
                path="/verifier"
                element={
                  <RegisteredUserRoute>
                    <Navbar />
                    <VerifierDashboard />
                  </RegisteredUserRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </CertificateProvider>
    </AuthProvider>
  );
};

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Route untuk halaman publik (login) - redirect jika sudah login
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    if (user) {
      // User sudah login dan terdaftar, redirect ke dashboard
      return <Navigate to="/dashboard" replace />;
    } else {
      // User sudah login tapi belum terdaftar, redirect ke register
      return <Navigate to="/register" replace />;
    }
  }

  return <>{children}</>;
};

// Route yang memerlukan autentikasi tapi belum perlu registrasi
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route yang memerlukan user sudah terdaftar
const RegisteredUserRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

export default App;

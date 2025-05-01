import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import SecurityGuardLogin from "./Components/SecurityGuardLogin";
import SecurityGuardSignup from "./Components/SecurityGuardSignup";
import EntryPermissionForm from "./Components/EntryPermissionForm";
import GuardProfile from "./Components/GuardProfile";
import "./App.css";

// Protected Route function (checks localStorage directly)
const SecurityProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("securityToken");
  return token ? children : <Navigate to="/security/login" replace />;
};

const App = () => {
  return (
    <Router>
      <div className="security-app">
        <Routes>
          {/* Public Routes */}
          <Route path="/security/login" element={<SecurityGuardLogin />} />
          <Route path="/security/signup" element={<SecurityGuardSignup />} />
          <Route path="/guard-profile" element={<GuardProfile />} />

          {/* Protected Routes */}
          <Route
            path="/security/entry-permission"
            element={
              <SecurityProtectedRoute>
                <EntryPermissionForm />
              </SecurityProtectedRoute>
            }
          />

          {/* Default/Fallback Routes */}
          <Route path="/" element={<Navigate to="/security/login" replace />} />
          <Route path="*" element={<Navigate to="/security/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

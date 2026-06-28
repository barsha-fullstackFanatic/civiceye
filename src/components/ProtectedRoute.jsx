import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/" replace />;
  }

  return children;
}

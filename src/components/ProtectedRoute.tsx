import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/**
 * Wraps routes that require an authenticated user.
 * Redirects to the login page (with the original destination preserved)
 * if no user is signed in.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

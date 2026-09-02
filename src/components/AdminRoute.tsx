import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/**
 * Wraps routes that require an admin user. Non-admins are sent to
 * /home; logged-out users are sent to login (via ProtectedRoute's
 * usual behavior — this assumes auth loading has already resolved
 * because it's meant to be nested inside ProtectedRoute).
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;

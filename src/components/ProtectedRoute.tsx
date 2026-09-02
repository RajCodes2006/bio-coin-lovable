import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/**
 * Wraps routes that require an authenticated user.
 * Redirects to the login page if no user is signed in.
 * Waits for the Supabase session to finish restoring before
 * deciding, so a page refresh doesn't briefly bounce a
 * logged-in user back to /.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return <>{children}</>;
};

export default ProtectedRoute;

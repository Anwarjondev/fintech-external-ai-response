import { Navigate } from "react-router-dom";
import { useAuth, isBankAdmin, isGovernmentUser } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/index";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function BankOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isBankAdmin(user)) return <Navigate to="/government/submit" replace />;
  return <>{children}</>;
}

export function GovernmentOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isGovernmentUser(user)) return <Navigate to="/bank/dashboard" replace />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (user) {
    // Redirect logged-in users to their dashboard
    return (
      <Navigate
        to={isBankAdmin(user) ? "/bank/dashboard" : "/government/submit"}
        replace
      />
    );
  }
  return <>{children}</>;
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <Spinner label="Loading…" />
    </div>
  );
}

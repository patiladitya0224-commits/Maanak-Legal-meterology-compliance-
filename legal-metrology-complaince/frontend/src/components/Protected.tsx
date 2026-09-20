import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../authStore";
import { useHydrated } from "../hooks/useHydrated";

export default function Protected() {
  const hydrated = useHydrated();
  const token = useAuth((s) => s.accessToken);
  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="shimmer h-10 w-48 rounded-full" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminOnly() {
  const role = useAuth((s) => s.user?.role);
  if (role !== "admin") return <Navigate to="/app" replace />;
  return <Outlet />;
}

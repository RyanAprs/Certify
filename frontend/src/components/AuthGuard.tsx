import { useAuth } from "../context/AuthContext";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { address, loading } = useAuth();

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 p-6">
        Checking session...
      </div>
    );
  }

  if (!address) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
        <p className="mb-4 text-sm text-slate-300">
          Silakan connect wallet untuk mengakses dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const DevLogin = () => {
  const { devLogin, loading } = useAuth();
  const [pk, setPk] = useState("");
  const [error, setError] = useState("");

  const handleDevLogin = async () => {
    setError("");
    try {
      await devLogin(pk);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 p-6 space-y-4">
      <h2 className="font-bold text-lg">Dev Login (Hardhat)</h2>

      <input
        value={pk}
        onChange={(e) => setPk(e.target.value)}
        placeholder="0x...."
        className="w-full rounded-md bg-slate-900 border border-slate-700 p-2 text-sm font-mono"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        disabled={loading || !pk}
        onClick={handleDevLogin}
        className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Login Dev"}
      </button>
    </div>
  );
};

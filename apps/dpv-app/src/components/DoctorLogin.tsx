"use client";

import { useState } from "react";
import type { Doctor } from "@/lib/db";

interface DoctorLoginProps {
  doctors: Doctor[];
  onLogin: (pin: string) => Promise<void>;
  onBack: () => void;
}

export default function DoctorLogin({
  doctors,
  onLogin,
  onBack,
}: DoctorLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(pin);
    } catch {
      setError("Invalid PIN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-center text-slate-800 mb-6">
          Doctor Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500"
              placeholder="••••"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button
          onClick={onBack}
          className="w-full mt-4 py-2 text-slate-600 text-sm"
        >
          Back
        </button>
      </div>
    </div>
  );
}

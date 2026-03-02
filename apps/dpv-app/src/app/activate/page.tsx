"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { activateLicense, isActivated } from "@/lib/activation";

export default function ActivatePage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    isActivated().then((activated) => {
      setChecking(false);
      if (activated) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await activateLicense(licenseKey.trim());
      if (result.success) {
        router.replace("/");
        router.refresh();
      } else {
        setError(result.error || "Activation failed");
      }
    } catch {
      setError("Activation failed");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Doctor Prescription Voice
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Enter your license key to activate
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="HOSP-2025-XXXX"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Activating..." : "Activate"}
          </button>
        </form>
        <p className="text-xs text-slate-500 text-center mt-4">
          Internet connection required for activation. App works offline after
          activation.
        </p>
      </div>
    </div>
  );
}

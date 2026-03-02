"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isActivated } from "@/lib/activation";
import { getSetting } from "@/lib/db";
import AdminPanel from "@/components/AdminPanel";

const DEFAULT_MASTER_PIN = "1234";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [pin, setPin] = useState("");
  const [masterPin, setMasterPin] = useState(DEFAULT_MASTER_PIN);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    isActivated().then((a) => {
      setActivated(a);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (activated) {
      getSetting("masterPin").then((p) => setMasterPin(p || DEFAULT_MASTER_PIN));
    }
  }, [activated]);

  useEffect(() => {
    if (ready && !activated) router.replace("/activate");
  }, [ready, activated, router]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (pin === masterPin) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Invalid PIN");
    }
  }

  if (!ready) return null;

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-xl font-bold text-center mb-6">
            Admin Settings
          </h1>
          <p className="text-center text-slate-600 text-sm mb-4">
            Enter master PIN to continue
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 border rounded-lg text-center"
              placeholder="PIN"
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg"
            >
              Unlock
            </button>
          </form>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 py-2 text-slate-600 text-sm"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return <AdminPanel onBack={() => router.push("/")} />;
}

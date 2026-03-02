"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isActivated } from "@/lib/activation";
import Link from "next/link";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    isActivated().then((a) => {
      setActivated(a);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready && !activated) {
      router.replace("/activate");
    }
  }, [ready, activated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-bold text-slate-800">
          Doctor Prescription Voice
        </h1>
      </header>
      <main className="p-4 space-y-4">
        <Link
          href="/prescription"
          className="block w-full py-4 px-4 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700"
        >
          New Prescription
        </Link>
        <Link
          href="/prescriptions"
          className="block w-full py-4 px-4 bg-white border border-slate-200 text-slate-800 text-center font-medium rounded-lg hover:bg-slate-50"
        >
          View Prescriptions
        </Link>
        <Link
          href="/export"
          className="block w-full py-4 px-4 bg-white border border-slate-200 text-slate-800 text-center font-medium rounded-lg hover:bg-slate-50"
        >
          Export Excel
        </Link>
        <Link
          href="/admin"
          className="block w-full py-4 px-4 bg-white border border-slate-200 text-slate-800 text-center font-medium rounded-lg hover:bg-slate-50"
        >
          Admin Settings
        </Link>
      </main>
    </div>
  );
}

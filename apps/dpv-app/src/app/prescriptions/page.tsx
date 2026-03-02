"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isActivated } from "@/lib/activation";
import { db } from "@/lib/db";
import type { Prescription } from "@/lib/db";
import Link from "next/link";

export default function PrescriptionsPage() {
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [prescriptions, setPrescriptions] = useState<
    (Prescription & { doctorName?: string; patientName?: string })[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    isActivated().then((a) => {
      setActivated(a);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready && !activated) router.replace("/activate");
  }, [ready, activated, router]);

  useEffect(() => {
    if (!activated) return;
    db.prescriptions
      .orderBy("createdAt")
      .reverse()
      .toArray()
      .then(async (list) => {
        const withNames = await Promise.all(
          list.map(async (p) => {
            const doctor = await db.doctors.get(p.doctorId);
            const patient = await db.patients.get(p.patientId);
            return {
              ...p,
              doctorName: doctor?.name ?? "Unknown",
              patientName: patient?.name ?? "Unknown",
            };
          })
        );
        setPrescriptions(withNames);
      });
  }, [activated]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Prescriptions</h1>
        <Link href="/" className="text-blue-600 text-sm">
          Home
        </Link>
      </header>
      <main className="p-4">
        <div className="space-y-2">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg border p-4"
            >
              <p className="font-medium">
                {p.patientName} - Dr. {p.doctorName}
              </p>
              <p className="text-sm text-slate-600 truncate">
                {p.diagnosisText}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(p.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

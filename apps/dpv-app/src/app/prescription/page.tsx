"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isActivated } from "@/lib/activation";
import { db } from "@/lib/db";
import type { Doctor, Patient } from "@/lib/db";
import { verifyPin } from "@/lib/pinHash";
import DoctorLogin from "@/components/DoctorLogin";
import PrescriptionForm from "@/components/PrescriptionForm";

export default function PrescriptionPage() {
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
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
    if (activated) {
      db.doctors.toArray().then((list) => {
        setDoctors(list.filter((d) => d.isActive !== false));
      });
    }
  }, [activated]);

  async function handleDoctorLogin(pin: string) {
    const doc = doctors.find((d) => d.pin === pin);
    if (doc) {
      const valid = await verifyPin(pin, doc.pin);
      if (valid) {
        setDoctor(doc);
        return;
      }
    }
    for (const d of doctors) {
      const valid = await verifyPin(pin, d.pin);
      if (valid) {
        setDoctor(d);
        return;
      }
    }
    throw new Error("Invalid PIN");
  }

  if (!ready || !activated) return null;

  if (doctors.length === 0) {
    return (
      <div className="min-h-screen p-4">
        <p className="text-slate-600">
          No doctors configured. Add doctors in Admin Settings first.
        </p>
        <button
          onClick={() => router.push("/admin")}
          className="mt-4 text-blue-600"
        >
          Go to Admin
        </button>
      </div>
    );
  }

  if (!doctor) {
    return (
      <DoctorLogin
        doctors={doctors}
        onLogin={handleDoctorLogin}
        onBack={() => router.push("/")}
      />
    );
  }

  return (
    <PrescriptionForm
      doctor={doctor}
      onBack={() => setDoctor(null)}
      onComplete={() => router.push("/")}
    />
  );
}

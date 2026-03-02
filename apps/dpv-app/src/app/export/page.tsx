"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isActivated } from "@/lib/activation";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function ExportPage() {
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [prescriptions, setPrescriptions] = useState<
    {
      date: string;
      doctorName: string;
      patientName: string;
      age: number;
      diagnosis: string;
      medicines: string;
      consultationFee: number;
    }[]
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
    loadPrescriptions();
  }, [activated, date]);

  async function loadPrescriptions() {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const list = await db.prescriptions
      .where("createdAt")
      .between(start.getTime(), end.getTime())
      .toArray();

    const withNames = await Promise.all(
      list.map(async (p) => {
        const doctor = await db.doctors.get(p.doctorId);
        const patient = await db.patients.get(p.patientId);
        const medicinesStr = p.prescriptionJSON
          .map(
            (m) =>
              `${m.medicineName} ${m.strength} - ${m.dosage} - ${m.duration}`
          )
          .join("; ");
        return {
          date: new Date(p.createdAt).toLocaleDateString(),
          doctorName: doctor?.name ?? "Unknown",
          patientName: patient?.name ?? "Unknown",
          age: patient?.age ?? 0,
          diagnosis: p.diagnosisText,
          medicines: medicinesStr,
          consultationFee: p.consultationFee,
        };
      })
    );
    setPrescriptions(withNames);
  }

  function handleExportExcel() {
    const ws = XLSX.utils.json_to_sheet(prescriptions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prescriptions");
    XLSX.writeFile(wb, `prescriptions-${date}.xlsx`);
  }

  async function handleShare() {
    if (!navigator.share) {
      alert("Web Share not supported. Use Excel export.");
      return;
    }
    const csv = prescriptions
      .map(
        (p) =>
          `${p.date},${p.doctorName},${p.patientName},${p.age},${p.diagnosis},${p.medicines},${p.consultationFee}`
      )
      .join("\n");
    const blob = new Blob(
      ["Date,Doctor,Patient,Age,Diagnosis,Medicines,Fee\n" + csv],
      { type: "text/csv" }
    );
    const file = new File([blob], `prescriptions-${date}.csv`, {
      type: "text/csv",
    });
    try {
      await navigator.share({
        title: `Prescriptions ${date}`,
        files: [file],
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Export</h1>
        <Link href="/" className="text-blue-600 text-sm">
          Home
        </Link>
      </header>
      <main className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Export Excel
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Share (WhatsApp, etc.)
          </button>
        </div>
        <div className="text-sm text-slate-600">
          {prescriptions.length} prescriptions for {date}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import {
  getSetting,
  setSetting,
  type Doctor,
  type Medicine,
  type Disease,
  type PriorityMedicine,
} from "@/lib/db";
import { hashPin } from "@/lib/pinHash";
import Link from "next/link";

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [tab, setTab] = useState<
    "doctors" | "medicines" | "diseases" | "priority" | "printer" | "backup"
  >("doctors");
  const [license, setLicense] = useState<{
    hospitalName: string;
    hospitalLogo: string;
  } | null>(null);

  useEffect(() => {
    db.license.toCollection().first().then((l) => {
      if (l) setLicense({ hospitalName: l.hospitalName, hospitalLogo: l.hospitalLogo });
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Admin Settings</h1>
        <button onClick={onBack} className="text-blue-600 text-sm">
          Back
        </button>
      </header>

      {license && (
        <div className="p-4 bg-white border-b">
          <p className="text-sm text-slate-600">Hospital (locked)</p>
          <p className="font-medium">{license.hospitalName}</p>
          {license.hospitalLogo && (
            <img
              src={license.hospitalLogo}
              alt="Logo"
              className="h-12 mt-2"
            />
          )}
        </div>
      )}

      <nav className="flex overflow-x-auto border-b bg-white p-2 gap-2">
        {[
          ["doctors", "Doctors"],
          ["medicines", "Medicines"],
          ["diseases", "Diseases"],
          ["priority", "Priority Meds"],
          ["printer", "Printer"],
          ["backup", "Backup"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === k ? "bg-blue-600 text-white" : "bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="p-4">
        {tab === "doctors" && <DoctorsTab />}
        {tab === "medicines" && <MedicinesTab />}
        {tab === "diseases" && <DiseasesTab />}
        {tab === "priority" && <PriorityTab />}
        {tab === "printer" && <PrinterTab />}
        {tab === "backup" && <BackupTab />}
      </main>
    </div>
  );
}

function DoctorsTab() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({
    name: "",
    degree: "",
    registrationNumber: "",
    signatureImage: "",
    pin: "",
    isActive: true,
  });

  useEffect(() => {
    db.doctors.toArray().then(setDoctors);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const pinHash = await hashPin(form.pin);
    if (editing) {
      await db.doctors.update(editing.id!, {
        ...form,
        pin: pinHash,
        isActive: form.isActive,
      });
    } else {
      await db.doctors.add({
        ...form,
        pin: pinHash,
        isActive: form.isActive,
      });
    }
    setEditing(null);
    setForm({
      name: "",
      degree: "",
      registrationNumber: "",
      signatureImage: "",
      pin: "",
      isActive: true,
    });
    db.doctors.toArray().then(setDoctors);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this doctor?")) {
      await db.doctors.delete(id);
      db.doctors.toArray().then(setDoctors);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Doctors</h2>
      <form onSubmit={handleSave} className="space-y-4 p-4 bg-white rounded-lg border">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Degree"
          value={form.degree}
          onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Registration Number"
          value={form.registrationNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, registrationNumber: e.target.value }))
          }
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Signature Image URL"
          value={form.signatureImage}
          onChange={(e) =>
            setForm((f) => ({ ...f, signatureImage: e.target.value }))
          }
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="PIN"
          value={form.pin}
          onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.checked }))
            }
          />
          Active
        </label>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          {editing ? "Update" : "Add"} Doctor
        </button>
      </form>
      <div className="space-y-2">
        {doctors.map((d) => (
          <div
            key={d.id}
            className="flex justify-between items-center p-4 bg-white rounded border"
          >
            <span>
              <strong>{d.name}</strong> ({d.degree})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(d);
                  setForm({
                    name: d.name,
                    degree: d.degree,
                    registrationNumber: d.registrationNumber,
                    signatureImage: d.signatureImage,
                    pin: "",
                    isActive: d.isActive ?? true,
                  });
                }}
                className="text-blue-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(d.id!)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicinesTab() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState({
    name: "",
    strength: "",
    defaultDosage: "",
    defaultDuration: "",
    notes: "",
  });

  useEffect(() => {
    db.medicines.orderBy("name").toArray().then(setMedicines);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await db.medicines.add({
      ...form,
      createdAt: Date.now(),
    });
    setForm({
      name: "",
      strength: "",
      defaultDosage: "",
      defaultDuration: "",
      notes: "",
    });
    db.medicines.orderBy("name").toArray().then(setMedicines);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this medicine?")) {
      await db.medicines.delete(id);
      await db.priorityMedicines.where("medicineId").equals(id).delete();
      db.medicines.orderBy("name").toArray().then(setMedicines);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Medicines</h2>
      <form onSubmit={handleSave} className="space-y-4 p-4 bg-white rounded-lg border">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Strength"
          value={form.strength}
          onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Default Dosage"
          value={form.defaultDosage}
          onChange={(e) =>
            setForm((f) => ({ ...f, defaultDosage: e.target.value }))
          }
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Default Duration"
          value={form.defaultDuration}
          onChange={(e) =>
            setForm((f) => ({ ...f, defaultDuration: e.target.value }))
          }
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Medicine
        </button>
      </form>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {medicines.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center p-3 bg-white rounded border"
          >
            <span>
              {m.name} {m.strength}
            </span>
            <button
              onClick={() => handleDelete(m.id!)}
              className="text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiseasesTab() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [form, setForm] = useState({ name: "", notes: "" });

  useEffect(() => {
    db.diseases.toArray().then(setDiseases);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await db.diseases.add(form);
    setForm({ name: "", notes: "" });
    db.diseases.toArray().then(setDiseases);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this disease?")) {
      await db.diseases.delete(id);
      await db.priorityMedicines.where("diseaseId").equals(id).delete();
      db.diseases.toArray().then(setDiseases);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Diseases</h2>
      <form onSubmit={handleSave} className="space-y-4 p-4 bg-white rounded-lg border">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Disease
        </button>
      </form>
      <div className="space-y-2">
        {diseases.map((d) => (
          <div
            key={d.id}
            className="flex justify-between items-center p-3 bg-white rounded border"
          >
            <span>{d.name}</span>
            <button
              onClick={() => handleDelete(d.id!)}
              className="text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityTab() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [mappings, setMappings] = useState<PriorityMedicine[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<number | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<number | null>(null);

  useEffect(() => {
    db.diseases.toArray().then(setDiseases);
    db.medicines.toArray().then(setMedicines);
    db.priorityMedicines.toArray().then(setMappings);
  }, []);

  async function handleAdd() {
    if (!selectedDisease || !selectedMedicine) return;
    const exists = mappings.some(
      (m) => m.diseaseId === selectedDisease && m.medicineId === selectedMedicine
    );
    if (exists) return;
    await db.priorityMedicines.add({
      diseaseId: selectedDisease,
      medicineId: selectedMedicine,
    });
    db.priorityMedicines.toArray().then(setMappings);
  }

  async function handleRemove(id: number) {
    await db.priorityMedicines.delete(id);
    db.priorityMedicines.toArray().then(setMappings);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Priority Medicines by Disease</h2>
      <div className="flex gap-4 flex-wrap">
        <select
          value={selectedDisease ?? ""}
          onChange={(e) =>
            setSelectedDisease(e.target.value ? parseInt(e.target.value) : null)
          }
          className="px-4 py-2 border rounded"
        >
          <option value="">Select disease</option>
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={selectedMedicine ?? ""}
          onChange={(e) =>
            setSelectedMedicine(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="px-4 py-2 border rounded"
        >
          <option value="">Select medicine</option>
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.strength}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedDisease || !selectedMedicine}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Add Mapping
        </button>
      </div>
      <div className="space-y-2">
        {mappings.map((m) => {
          const disease = diseases.find((d) => d.id === m.diseaseId);
          const medicine = medicines.find((med) => med.id === m.medicineId);
          return (
            <div
              key={m.id}
              className="flex justify-between items-center p-3 bg-white rounded border"
            >
              <span>
                {disease?.name ?? "?"} → {medicine?.name ?? "?"}
              </span>
              <button
                onClick={() => handleRemove(m.id!)}
                className="text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrinterTab() {
  const [printerIP, setPrinterIP] = useState("");
  const [printerPort, setPrinterPort] = useState("9100");
  const [autoLockTime, setAutoLockTime] = useState("5");
  const [masterPin, setMasterPin] = useState("1234");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSetting("printerIP").then(setPrinterIP);
    getSetting("printerPort").then((p) => setPrinterPort(p || "9100"));
    getSetting("autoLockTime").then((t) => setAutoLockTime(t || "5"));
    getSetting("masterPin").then((p) => setMasterPin(p || "1234"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await setSetting("printerIP", printerIP);
    await setSetting("printerPort", printerPort);
    await setSetting("autoLockTime", autoLockTime);
    await setSetting("masterPin", masterPin);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Printer Configuration</h2>
      <form onSubmit={handleSave} className="space-y-4 p-4 bg-white rounded-lg border">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Printer IP</label>
          <input
            type="text"
            value={printerIP}
            onChange={(e) => setPrinterIP(e.target.value)}
            placeholder="192.168.1.100"
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Port</label>
          <input
            type="text"
            value={printerPort}
            onChange={(e) => setPrinterPort(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Auto-lock (minutes)
          </label>
          <input
            type="number"
            value={autoLockTime}
            onChange={(e) => setAutoLockTime(e.target.value)}
            min={1}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Master PIN (for Admin)
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={masterPin}
            onChange={(e) => setMasterPin(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-2 border rounded"
            maxLength={6}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Save
        </button>
        {saved && <p className="text-green-600 text-sm">Saved</p>}
      </form>
    </div>
  );
}

function BackupTab() {
  const [restoring, setRestoring] = useState(false);

  async function handleExport() {
    const data = {
      doctors: await db.doctors.toArray(),
      medicines: await db.medicines.toArray(),
      diseases: await db.diseases.toArray(),
      priorityMedicines: await db.priorityMedicines.toArray(),
      patients: await db.patients.toArray(),
      prescriptions: await db.prescriptions.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dpv-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !confirm("Restore will overwrite existing data. Continue?"))
      return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.doctors.clear();
      await db.medicines.clear();
      await db.diseases.clear();
      await db.priorityMedicines.clear();
      await db.patients.clear();
      await db.prescriptions.clear();
      await db.settings.clear();

      if (data.doctors?.length) await db.doctors.bulkAdd(data.doctors);
      if (data.medicines?.length) await db.medicines.bulkAdd(data.medicines);
      if (data.diseases?.length) await db.diseases.bulkAdd(data.diseases);
      if (data.priorityMedicines?.length)
        await db.priorityMedicines.bulkAdd(data.priorityMedicines);
      if (data.patients?.length) await db.patients.bulkAdd(data.patients);
      if (data.prescriptions?.length)
        await db.prescriptions.bulkAdd(data.prescriptions);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);

      alert("Restore complete");
      window.location.reload();
    } catch (err) {
      alert("Restore failed: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Backup & Restore</h2>
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export Backup
        </button>
        <label className="px-4 py-2 bg-slate-200 rounded cursor-pointer">
          {restoring ? "Restoring..." : "Restore from File"}
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            disabled={restoring}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

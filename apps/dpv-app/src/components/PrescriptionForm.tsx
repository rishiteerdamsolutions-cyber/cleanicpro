"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type {
  Doctor,
  Patient,
  Medicine,
  Disease,
  Prescription,
  PrescriptionItem,
} from "@/lib/db";
import VoiceInput from "./VoiceInput";
import { getSetting } from "@/lib/db";
import { printPrescription } from "@/lib/print";

interface PrescriptionFormProps {
  doctor: Doctor;
  onBack: () => void;
  onComplete: () => void;
}

export default function PrescriptionForm({
  doctor,
  onBack,
  onComplete,
}: PrescriptionFormProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);
  const [consultationFee, setConsultationFee] = useState(0);
  const [step, setStep] = useState<"patient" | "diagnosis" | "medicines" | "preview">("patient");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicinesList, setMedicinesList] = useState<Medicine[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [priorityMap, setPriorityMap] = useState<Record<number, number[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.patients.orderBy("createdAt").reverse().toArray().then(setPatients);
    db.medicines.orderBy("name").toArray().then(setMedicinesList);
    db.diseases.toArray().then(setDiseases);
    db.priorityMedicines.toArray().then((list) => {
      const map: Record<number, number[]> = {};
      for (const pm of list) {
        if (!map[pm.diseaseId]) map[pm.diseaseId] = [];
        map[pm.diseaseId].push(pm.medicineId);
      }
      setPriorityMap(map);
    });
  }, []);

  const addMedicine = useCallback(
    (med: Medicine) => {
      if (medicines.some((m) => m.medicineId === med.id)) return;
      setMedicines((prev) => [
        ...prev,
        {
          medicineId: med.id!,
          medicineName: med.name,
          strength: med.strength,
          dosage: med.defaultDosage,
          duration: med.defaultDuration,
          notes: med.notes,
        },
      ]);
    },
    [medicines]
  );

  const removeMedicine = useCallback((medicineId: number) => {
    setMedicines((prev) => prev.filter((m) => m.medicineId !== medicineId));
  }, []);

  const updateMedicine = useCallback(
    (medicineId: number, field: keyof PrescriptionItem, value: string) => {
      setMedicines((prev) =>
        prev.map((m) =>
          m.medicineId === medicineId ? { ...m, [field]: value } : m
        )
      );
    },
    []
  );

  async function handleSaveAndPrint() {
    if (!patient || !doctor.id) return;
    setSaving(true);
    try {
      const prescription: Omit<Prescription, "id"> = {
        doctorId: doctor.id,
        patientId: patient.id!,
        diagnosisText: diagnosis,
        prescriptionJSON: medicines,
        consultationFee,
        createdAt: Date.now(),
      };
      const id = await db.prescriptions.add(prescription);

      const printerIP = await getSetting("printerIP");
      const printerPort = await getSetting("printerPort") || "9100";
      if (printerIP) {
        await printPrescription({
          doctor,
          patient,
          diagnosis,
          medicines,
          consultationFee,
          printerIP,
          printerPort,
        });
      }

      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (step === "patient") {
    return (
      <PatientStep
        patients={patients}
        selectedPatient={patient}
        onSelect={setPatient}
        onNext={() => setStep("diagnosis")}
        onBack={onBack}
        onAddPatient={async (p) => {
          const id = await db.patients.add({
            ...p,
            createdAt: Date.now(),
          });
          const newPatient = { ...p, id, createdAt: Date.now() };
          setPatients((prev) => [newPatient, ...prev]);
          setPatient(newPatient);
        }}
      />
    );
  }

  if (step === "diagnosis") {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Diagnosis</h2>
          <VoiceInput
            value={diagnosis}
            onChange={setDiagnosis}
            language="en-IN"
            placeholder="Speak or type diagnosis..."
          />
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep("patient")}
              className="px-4 py-2 border rounded-lg"
            >
              Back
            </button>
            <button
              onClick={() => setStep("medicines")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Next: Medicines
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "medicines") {
    const matchedDiseases = diseases.filter((d) =>
      diagnosis.toLowerCase().includes(d.name.toLowerCase())
    );
    const priorityIds = new Set<number>();
    for (const d of matchedDiseases) {
      (priorityMap[d.id!] || []).forEach((mid) => priorityIds.add(mid));
    }
    const priorityMeds = medicinesList.filter((m) => m.id && priorityIds.has(m.id));

    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-2">Medicines</h2>
          <p className="text-sm text-slate-600 mb-4">
            Diagnosis: {diagnosis || "(none)"}
          </p>
          {priorityMeds.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Suggested (from diagnosis):
              </p>
              <div className="flex flex-wrap gap-2">
                {priorityMeds.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addMedicine(m)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    + {m.name} {m.strength}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Added medicines:
            </p>
            <div className="space-y-2">
              {medicines.map((m) => (
                <div
                  key={m.medicineId}
                  className="flex items-center gap-2 p-2 bg-white rounded border"
                >
                  <span className="flex-1">
                    {m.medicineName} {m.strength} - {m.dosage} - {m.duration}
                  </span>
                  <input
                    type="text"
                    value={m.dosage}
                    onChange={(e) =>
                      updateMedicine(m.medicineId, "dosage", e.target.value)
                    }
                    className="w-20 px-2 py-1 border text-sm"
                    placeholder="Dose"
                  />
                  <input
                    type="text"
                    value={m.duration}
                    onChange={(e) =>
                      updateMedicine(m.medicineId, "duration", e.target.value)
                    }
                    className="w-20 px-2 py-1 border text-sm"
                    placeholder="Duration"
                  />
                  <button
                    onClick={() => removeMedicine(m.medicineId)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Add from list:
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {medicinesList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addMedicine(m)}
                  disabled={medicines.some((x) => x.medicineId === m.id)}
                  className="block w-full text-left px-3 py-2 bg-white border rounded text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {m.name} {m.strength}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep("diagnosis")}
              className="px-4 py-2 border rounded-lg"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-600">Doctor</p>
            <p className="font-medium">
              Dr. {doctor.name} ({doctor.degree})
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Patient</p>
            <p className="font-medium">
              {patient?.name}, {patient?.age}y, {patient?.gender}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Diagnosis</p>
            <p>{diagnosis}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Medicines</p>
            <ul className="list-disc pl-4">
              {medicines.map((m) => (
                <li key={m.medicineId}>
                  {m.medicineName} {m.strength} - {m.dosage} - {m.duration}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-slate-600">Consultation Fee</p>
            <p>₹{consultationFee}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <input
            type="number"
            value={consultationFee || ""}
            onChange={(e) => setConsultationFee(parseInt(e.target.value) || 0)}
            placeholder="Consultation fee"
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => setStep("medicines")}
            className="px-4 py-2 border rounded-lg"
          >
            Back
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Print"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientStep({
  patients,
  selectedPatient,
  onSelect,
  onNext,
  onBack,
  onAddPatient,
}: {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelect: (p: Patient) => void;
  onNext: () => void;
  onBack: () => void;
  onAddPatient: (p: Omit<Patient, "id" | "createdAt">) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: 0,
    gender: "M",
    phone: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await onAddPatient(newPatient);
    setShowAdd(false);
    setNewPatient({ name: "", age: 0, gender: "M", phone: "" });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Select Patient</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full text-left px-4 py-3 rounded-lg border ${
                selectedPatient?.id === p.id
                  ? "border-blue-600 bg-blue-50"
                  : "bg-white"
              }`}
            >
              {p.name}, {p.age}y, {p.gender}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="mt-4 w-full py-3 border-2 border-dashed rounded-lg text-slate-600"
        >
          + Add New Patient
        </button>
        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="mt-4 p-4 bg-white rounded-lg border space-y-4"
          >
            <input
              type="text"
              placeholder="Name"
              value={newPatient.name}
              onChange={(e) =>
                setNewPatient((n) => ({ ...n, name: e.target.value }))
              }
              required
              className="w-full px-4 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Age"
              value={newPatient.age || ""}
              onChange={(e) =>
                setNewPatient((n) => ({
                  ...n,
                  age: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-4 py-2 border rounded"
            />
            <select
              value={newPatient.gender}
              onChange={(e) =>
                setNewPatient((n) => ({ ...n, gender: e.target.value }))
              }
              className="w-full px-4 py-2 border rounded"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            <input
              type="tel"
              placeholder="Phone"
              value={newPatient.phone}
              onChange={(e) =>
                setNewPatient((n) => ({ ...n, phone: e.target.value }))
              }
              className="w-full px-4 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="flex gap-4 mt-6">
          <button onClick={onBack} className="px-4 py-2 border rounded-lg">
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!selectedPatient}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

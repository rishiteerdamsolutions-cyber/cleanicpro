import Dexie, { type EntityTable } from "dexie";

export interface License {
  id?: number;
  licenseId: string;
  hospitalName: string;
  hospitalLogo: string;
  activationToken: string;
  maxDevices: number;
}

export interface Doctor {
  id?: number;
  name: string;
  degree: string;
  registrationNumber: string;
  signatureImage: string;
  pin: string;
  isActive: boolean;
}

export interface Medicine {
  id?: number;
  name: string;
  strength: string;
  defaultDosage: string;
  defaultDuration: string;
  notes: string;
  createdAt: number;
}

export interface Disease {
  id?: number;
  name: string;
  notes: string;
}

export interface PriorityMedicine {
  id?: number;
  diseaseId: number;
  medicineId: number;
}

export interface Patient {
  id?: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  createdAt: number;
}

export interface PrescriptionItem {
  medicineId: number;
  medicineName: string;
  strength: string;
  dosage: string;
  duration: string;
  notes?: string;
}

export interface Prescription {
  id?: number;
  doctorId: number;
  patientId: number;
  diagnosisText: string;
  prescriptionJSON: PrescriptionItem[];
  consultationFee: number;
  createdAt: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

class DPVDatabase extends Dexie {
  license!: EntityTable<License, "id">;
  doctors!: EntityTable<Doctor, "id">;
  medicines!: EntityTable<Medicine, "id">;
  diseases!: EntityTable<Disease, "id">;
  priorityMedicines!: EntityTable<PriorityMedicine, "id">;
  patients!: EntityTable<Patient, "id">;
  prescriptions!: EntityTable<Prescription, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("DPVDatabase");
    this.version(1).stores({
      license: "++id, licenseId",
      doctors: "++id, name",
      medicines: "++id, name, createdAt",
      diseases: "++id, name",
      priorityMedicines: "++id, diseaseId, medicineId",
      patients: "++id, name, createdAt",
      prescriptions: "++id, doctorId, patientId, createdAt",
      settings: "++id, key",
    });
  }
}

export const db = new DPVDatabase();

export async function getSetting(key: string): Promise<string> {
  const s = await db.settings.where("key").equals(key).first();
  return s?.value ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where("key").equals(key).first();
  if (existing) {
    await db.settings.update(existing.id!, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

"use client";

import { useEffect, useState } from "react";
import CreateLicenseForm from "@/components/CreateLicenseForm";
import LicenseTable from "@/components/LicenseTable";

interface Hospital {
  _id: string;
  licenseKey: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  headDoctorName?: string;
  responsiblePersonName?: string;
  maxDevicesAllowed: number;
  licenseType: string;
  notes?: string;
  logoUrl?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function fetchHospitals() {
    try {
      const res = await fetch("/api/hospitals");
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHospitals();
  }, []);

  function onLicenseCreated() {
    setShowForm(false);
    fetchHospitals();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">License Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancel" : "Create License"}
        </button>
      </div>

      {showForm && (
        <CreateLicenseForm
          onSuccess={onLicenseCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : (
        <LicenseTable hospitals={hospitals} onUpdate={fetchHospitals} />
      )}
    </div>
  );
}

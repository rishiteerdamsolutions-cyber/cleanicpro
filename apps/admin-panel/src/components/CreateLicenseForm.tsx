"use client";

import { useState } from "react";

interface CreateLicenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateLicenseForm({
  onSuccess,
  onCancel,
}: CreateLicenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    hospitalName: "",
    hospitalAddress: "",
    hospitalPhone: "",
    headDoctorName: "",
    responsiblePersonName: "",
    maxDevicesAllowed: 1,
    licenseType: "Starter",
    notes: "",
    logoUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create license");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Create Hospital License
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hospital Name *
            </label>
            <input
              type="text"
              value={form.hospitalName}
              onChange={(e) =>
                setForm((f) => ({ ...f, hospitalName: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hospital Phone
            </label>
            <input
              type="text"
              value={form.hospitalPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, hospitalPhone: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Devices
            </label>
            <input
              type="number"
              min={1}
              value={form.maxDevicesAllowed}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxDevicesAllowed: parseInt(e.target.value) || 1,
                }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              License Type
            </label>
            <select
              value={form.licenseType}
              onChange={(e) =>
                setForm((f) => ({ ...f, licenseType: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Starter">Starter</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Head Doctor
            </label>
            <input
              type="text"
              value={form.headDoctorName}
              onChange={(e) =>
                setForm((f) => ({ ...f, headDoctorName: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Responsible Person
            </label>
            <input
              type="text"
              value={form.responsiblePersonName}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  responsiblePersonName: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hospital Address
            </label>
            <textarea
              value={form.hospitalAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, hospitalAddress: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, logoUrl: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create License"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

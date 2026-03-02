"use client";

import React, { useState } from "react";

interface Hospital {
  _id: string;
  licenseKey: string;
  hospitalName: string;
  hospitalPhone?: string;
  maxDevicesAllowed: number;
  licenseType: string;
  createdAt: string;
  activatedDevicesCount?: number;
}

interface LicenseTableProps {
  hospitals: Hospital[];
  onUpdate: () => void;
}

function getWhatsAppLink(hospital: Hospital) {
  const phone = (hospital.hospitalPhone || "").replace(/\D/g, "");
  const message = [
    `Dear ${hospital.hospitalName},`,
    "",
    "Your Doctor Prescription Voice License is ready.",
    "",
    `License Key: ${hospital.licenseKey}`,
    `Maximum Devices Allowed: ${hospital.maxDevicesAllowed}`,
    "",
    "Activation Steps:",
    "1. Install the app.",
    "2. Enter the license key.",
    "3. Complete activation.",
    "",
    "Thank you.",
  ].join("\n");
  const url = `https://wa.me/${phone || "0"}?text=${encodeURIComponent(message)}`;
  return url;
}

export default function LicenseTable({ hospitals, onUpdate }: LicenseTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Record<string, { deviceFingerprint: string; activatedAt: string; status: string }[]>>({});
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null);
  const [newMaxDevices, setNewMaxDevices] = useState<number>(1);

  async function loadDevices(licenseKey: string) {
    const res = await fetch(`/api/devices?licenseKey=${encodeURIComponent(licenseKey)}`);
    if (res.ok) {
      const data = await res.json();
      setDevices((d) => ({ ...d, [licenseKey]: data }));
    }
  }

  function toggleExpand(id: string, licenseKey: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDevices(licenseKey);
    }
  }

  async function deactivateDevice(licenseKey: string, deviceFingerprint: string) {
    if (!confirm("Deactivate this device?")) return;
    const res = await fetch("/api/devices/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, deviceFingerprint }),
    });
    if (res.ok) {
      onUpdate();
      loadDevices(licenseKey);
    }
  }

  async function upgradeLimit(id: string) {
    const res = await fetch(`/api/hospitals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxDevicesAllowed: newMaxDevices }),
    });
    if (res.ok) {
      setUpgradeModal(null);
      onUpdate();
    }
  }

  async function regenerateToken(id: string) {
    if (!confirm("Regenerate license token? Existing activations will remain valid.")) return;
    const res = await fetch(`/api/hospitals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateToken: true }),
    });
    if (res.ok) onUpdate();
  }

  if (hospitals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center text-slate-600">
        No licenses yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                Hospital
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                License Key
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                Devices
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                Type
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <React.Fragment key={h._id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">
                      {h.hospitalName}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{h.licenseKey}</td>
                  <td className="px-6 py-4">
                    {h.activatedDevicesCount ?? 0} / {h.maxDevicesAllowed}
                  </td>
                  <td className="px-6 py-4">{h.licenseType}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={getWhatsAppLink(h)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => toggleExpand(h._id, h.licenseKey)}
                        className="text-slate-600 hover:text-slate-800 text-sm"
                      >
                        {expandedId === h._id ? "Hide" : "Devices"}
                      </button>
                      <button
                        onClick={() => {
                          setUpgradeModal(h._id);
                          setNewMaxDevices(h.maxDevicesAllowed);
                        }}
                        className="text-slate-600 hover:text-slate-800 text-sm"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => regenerateToken(h._id)}
                        className="text-slate-600 hover:text-slate-800 text-sm"
                      >
                        Regenerate
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === h._id && (
                  <tr key={`${h._id}-devices`}>
                    <td colSpan={5} className="px-6 py-4 bg-slate-50">
                      <div className="space-y-2">
                        {devices[h.licenseKey]?.map((d) => (
                          <div
                            key={d.deviceFingerprint}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="font-mono text-slate-600">
                              {d.deviceFingerprint.slice(0, 16)}...
                            </span>
                            <span className="text-slate-500">
                              {new Date(d.activatedAt).toLocaleDateString()}
                            </span>
                            {d.status === "active" && (
                              <button
                                onClick={() =>
                                  deactivateDevice(h.licenseKey, d.deviceFingerprint)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        ))}
                        {(!devices[h.licenseKey] || devices[h.licenseKey].length === 0) && (
                          <p className="text-slate-500">No devices activated</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {upgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h3 className="font-semibold mb-4">Upgrade Device Limit</h3>
            <input
              type="number"
              min={1}
              value={newMaxDevices}
              onChange={(e) => setNewMaxDevices(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => upgradeLimit(upgradeModal)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setUpgradeModal(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

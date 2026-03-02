import type { Doctor, Patient, PrescriptionItem } from "./db";

interface PrintParams {
  doctor: Doctor;
  patient: Patient;
  diagnosis: string;
  medicines: PrescriptionItem[];
  consultationFee: number;
  printerIP: string;
  printerPort: string;
}

/**
 * ESC/POS thermal printer over network.
 * Sends raw ESC/POS commands to printer IP:port.
 */
export async function printPrescription({
  doctor,
  patient,
  diagnosis,
  medicines,
  consultationFee,
  printerIP,
  printerPort,
}: PrintParams): Promise<void> {
  const lines: string[] = [
    "",
    "=================================",
    "     PRESCRIPTION",
    "=================================",
    "",
    `Doctor: Dr. ${doctor.name}`,
    `Degree: ${doctor.degree}`,
    `Reg No: ${doctor.registrationNumber}`,
    "",
    "---------------------------------",
    `Patient: ${patient.name}`,
    `Age: ${patient.age} | Gender: ${patient.gender}`,
    `Phone: ${patient.phone || "-"}`,
    "",
    "---------------------------------",
    "Diagnosis:",
    diagnosis,
    "",
    "---------------------------------",
    "Medicines:",
    ...medicines.flatMap((m) => [
      `  - ${m.medicineName} ${m.strength}`,
      `    ${m.dosage} - ${m.duration}`,
    ]),
    "",
    "---------------------------------",
    `Consultation Fee: Rs. ${consultationFee}`,
    "",
    "=================================",
    "Thank you",
    "=================================",
    "",
    "",
  ];

  const text = lines.join("\n");

  // ESC/POS commands: Initialize, select character set, print text, cut
  const ESC = "\x1b";
  const GS = "\x1d";
  const init = ESC + "@";
  const cut = GS + "V" + "\x00";

  const fullCommand = init + text + cut;

  // Send via fetch to a local proxy or use WebSocket - browsers cannot open raw TCP.
  // For PWA, we need a different approach: use a local service or print via browser print dialog.
  // Fallback: use window.print() with a printable div.
  if (typeof window !== "undefined") {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Prescription</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 80mm; }
          pre { white-space: pre-wrap; }
        </style>
        </head>
        <body><pre>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  // For actual ESC/POS over network from a server/API, you would need a backend
  // that accepts the print job and sends to the printer. The DPV app is offline-first
  // so we use the browser print dialog as the primary method.
  // Optional: Add an API route in the admin panel that proxies to the printer,
  // and the DPV app could call it when online - but that breaks offline. So we
  // stick with browser print for now.
}

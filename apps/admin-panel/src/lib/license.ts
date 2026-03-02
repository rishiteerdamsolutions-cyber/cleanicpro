import { signLicenseToken } from "@dpv/license-crypto";

export function generateLicenseKey(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HOSP-${year}-${randomPart}`;
}

export function signHospitalLicense(
  licenseKey: string,
  hospitalId: string,
  maxDevices: number
): string {
  const privateKey = process.env.JWT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("JWT_PRIVATE_KEY not configured. Generate RSA key pair.");
  }
  return signLicenseToken(
    { licenseKey, hospitalId, maxDevices },
    privateKey
  );
}

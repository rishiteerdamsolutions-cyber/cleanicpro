import { db } from "./db";
import { getDeviceFingerprint } from "./deviceFingerprint";

const ACTIVATION_API =
  process.env.NEXT_PUBLIC_ACTIVATION_API_URL || "http://localhost:3001";

export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const deviceFingerprint = await getDeviceFingerprint();
    const res = await fetch(`${ACTIVATION_API}/api/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, deviceFingerprint }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Activation failed" };
    }

    await db.license.clear();
    await db.license.add({
      licenseId: licenseKey,
      hospitalName: data.hospitalName,
      hospitalLogo: data.hospitalLogo || "",
      activationToken: data.activationToken,
      maxDevices: data.maxDevices,
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function isActivated(): Promise<boolean> {
  const license = await db.license.toCollection().first();
  return !!license?.activationToken;
}

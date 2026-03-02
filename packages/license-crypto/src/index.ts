import jwt from "jsonwebtoken";

export interface LicenseTokenPayload {
  licenseKey: string;
  hospitalId: string;
  maxDevices: number;
  iat?: number;
  exp?: number;
}

export interface ActivationTokenPayload {
  hospitalId: string;
  deviceFingerprint: string;
  iat?: number;
  exp?: number;
}

const DEFAULT_EXPIRY_DAYS = 365 * 10; // 10 years for license
const ACTIVATION_EXPIRY_DAYS = 365 * 10; // 10 years for activation

export function signLicenseToken(
  payload: Omit<LicenseTokenPayload, "iat" | "exp">,
  privateKey: string
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: `${DEFAULT_EXPIRY_DAYS}d`,
  });
}

export function verifyLicenseToken(
  token: string,
  publicKey: string
): LicenseTokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as LicenseTokenPayload;
}

export function signActivationToken(
  payload: Omit<ActivationTokenPayload, "iat" | "exp">,
  privateKey: string
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: `${ACTIVATION_EXPIRY_DAYS}d`,
  });
}

export function verifyActivationToken(
  token: string,
  publicKey: string
): ActivationTokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as ActivationTokenPayload;
}

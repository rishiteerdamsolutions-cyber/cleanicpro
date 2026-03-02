import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "@/models/Admin";
import { connectDB } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRY = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createAdminToken(email: string): string {
  return jwt.sign(
    { email, role: "SUPER_ADMIN" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyAdminToken(token: string): {
  email: string;
  role: string;
} | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      email: string;
      role: string;
    };
    return payload;
  } catch {
    return null;
  }
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ token: string } | null> {
  await connectDB();
  const admin = await Admin.findOne({ email });
  if (!admin) return null;
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return null;
  const token = createAdminToken(admin.email);
  return { token };
}

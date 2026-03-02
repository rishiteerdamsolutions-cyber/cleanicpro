/**
 * Seed script to create initial Super Admin.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-admin.ts
 * Or: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node -e "
 *   require('dotenv').config();
 *   const { connectDB } = require('../src/lib/db');
 *   const Admin = require('../src/models/Admin').default;
 *   const { hashPassword } = require('../src/lib/auth');
 *   (async () => {
 *     await connectDB();
 *     const hash = await hashPassword(process.env.ADMIN_PASSWORD);
 *     await Admin.create({ email: process.env.ADMIN_EMAIL, passwordHash: hash, role: 'SUPER_ADMIN' });
 *     console.log('Admin created');
 *   })();
 * "
 */
import mongoose from "mongoose";
import Admin from "../src/models/Admin";
import { hashPassword } from "../src/lib/auth";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dpv-admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dpv.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const existing = await Admin.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists:", ADMIN_EMAIL);
    process.exit(0);
  }
  const hash = await hashPassword(ADMIN_PASSWORD);
  await Admin.create({ email: ADMIN_EMAIL, passwordHash: hash, role: "SUPER_ADMIN" });
  console.log("Admin created:", ADMIN_EMAIL);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

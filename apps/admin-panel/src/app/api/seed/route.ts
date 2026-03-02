import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";

/**
 * One-time seed: creates Super Admin if no admins exist.
 * Call: POST /api/seed with { "email": "admin@example.com", "password": "secret" }
 * Only works when Admin collection is empty.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const count = await Admin.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { error: "Admins already exist. Seed disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const email = body.email || "admin@dpv.local";
    const password = body.password || "admin123";

    const hash = await hashPassword(password);
    await Admin.create({ email, passwordHash: hash, role: "SUPER_ADMIN" });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

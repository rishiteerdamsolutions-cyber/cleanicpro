import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Device from "@/models/Device";
import { verifyAdminToken } from "@/lib/auth";

function getToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("admin_token");
  if (cookie?.value) return cookie.value;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { licenseKey, deviceFingerprint } = body;

    if (!licenseKey || !deviceFingerprint) {
      return NextResponse.json(
        { error: "licenseKey and deviceFingerprint required" },
        { status: 400 }
      );
    }

    await connectDB();

    const device = await Device.findOne({ licenseKey, deviceFingerprint });
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    device.status = "deactivated";
    await device.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate device error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

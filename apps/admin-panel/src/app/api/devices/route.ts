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

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const licenseKey = searchParams.get("licenseKey");

    if (!licenseKey) {
      return NextResponse.json(
        { error: "licenseKey required" },
        { status: 400 }
      );
    }

    await connectDB();

    const devices = await Device.find({ licenseKey }).sort({
      activatedAt: -1,
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("GET devices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

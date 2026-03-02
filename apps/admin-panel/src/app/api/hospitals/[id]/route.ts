import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Hospital from "@/models/Hospital";
import Device from "@/models/Device";
import { verifyAdminToken } from "@/lib/auth";
import { signHospitalLicense } from "@/lib/license";

function getToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("admin_token");
  if (cookie?.value) return cookie.value;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getToken(request);
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    if (body.maxDevicesAllowed !== undefined) {
      hospital.maxDevicesAllowed = body.maxDevicesAllowed;
    }

    if (body.regenerateToken) {
      hospital.signedLicenseToken = signHospitalLicense(
        hospital.licenseKey,
        hospital._id.toString(),
        hospital.maxDevicesAllowed
      );
    }

    await hospital.save();
    return NextResponse.json(hospital.toObject());
  } catch (error) {
    console.error("PATCH hospital error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

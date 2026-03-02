import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Hospital from "@/models/Hospital";
import { verifyAdminToken } from "@/lib/auth";
import { generateLicenseKey, signHospitalLicense } from "@/lib/license";

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

    await connectDB();
    const hospitals = await Hospital.find({}).sort({ createdAt: -1 }).lean();
    const Device = (await import("@/models/Device")).default;
    const hospitalsWithCount = await Promise.all(
      hospitals.map(async (h: { licenseKey: string; _id: unknown }) => {
        const activeCount = await Device.countDocuments({
          licenseKey: h.licenseKey,
          status: "active",
        });
        return { ...h, activatedDevicesCount: activeCount };
      })
    );
    return NextResponse.json(hospitalsWithCount);
  } catch (error) {
    console.error("GET hospitals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      hospitalName,
      hospitalAddress = "",
      hospitalPhone = "",
      headDoctorName = "",
      responsiblePersonName = "",
      maxDevicesAllowed = 1,
      licenseType = "Starter",
      notes = "",
      logoUrl = "",
    } = body;

    if (!hospitalName) {
      return NextResponse.json(
        { error: "hospitalName is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let licenseKey = generateLicenseKey();
    let exists = await Hospital.findOne({ licenseKey });
    while (exists) {
      licenseKey = generateLicenseKey();
      exists = await Hospital.findOne({ licenseKey });
    }

    const hospital = await Hospital.create({
      licenseKey,
      hospitalName,
      hospitalAddress,
      hospitalPhone,
      headDoctorName,
      responsiblePersonName,
      maxDevicesAllowed,
      licenseType,
      notes,
      logoUrl,
      signedLicenseToken: "", // set below
    });

    const signedToken = signHospitalLicense(
      licenseKey,
      hospital._id.toString(),
      maxDevicesAllowed
    );
    hospital.signedLicenseToken = signedToken;
    await hospital.save();

    return NextResponse.json({
      ...hospital.toObject(),
      signedLicenseToken: signedToken,
    });
  } catch (error) {
    console.error("POST hospitals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

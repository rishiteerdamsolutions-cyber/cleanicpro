import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Hospital from "@/models/Hospital";
import Device from "@/models/Device";
import { verifyLicenseToken, signActivationToken } from "@dpv/license-crypto";

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, deviceFingerprint } = body;

    if (!licenseKey || !deviceFingerprint) {
      return NextResponse.json(
        { error: "licenseKey and deviceFingerprint required" },
        { status: 400 }
      );
    }

    if (!JWT_PUBLIC_KEY || !JWT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    await connectDB();

    const hospital = await Hospital.findOne({ licenseKey });
    if (!hospital) {
      return NextResponse.json(
        { error: "Invalid license key" },
        { status: 404 }
      );
    }

    try {
      verifyLicenseToken(hospital.signedLicenseToken, JWT_PUBLIC_KEY);
    } catch {
      return NextResponse.json(
        { error: "License has been revoked or is invalid" },
        { status: 403 }
      );
    }

    const activeCount = await Device.countDocuments({
      licenseKey,
      status: "active",
    });

    const existingDevice = await Device.findOne({
      licenseKey,
      deviceFingerprint,
    });

    if (!existingDevice) {
      if (activeCount >= hospital.maxDevicesAllowed) {
        return NextResponse.json(
          { error: "Device limit reached for this license" },
          { status: 403 }
        );
      }

      await Device.create({
        licenseKey,
        deviceFingerprint,
        status: "active",
      });
    } else if (existingDevice.status === "deactivated") {
      return NextResponse.json(
        { error: "This device has been deactivated" },
        { status: 403 }
      );
    }

    const activationToken = signActivationToken(
      {
        hospitalId: hospital._id.toString(),
        deviceFingerprint,
      },
      JWT_PRIVATE_KEY
    );

    return NextResponse.json({
      activationToken,
      hospitalName: hospital.hospitalName,
      hospitalLogo: hospital.logoUrl || "",
      maxDevices: hospital.maxDevicesAllowed,
    });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  licenseKey: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  activatedAt: { type: Date, default: Date.now },
  status: { type: String, default: "active", enum: ["active", "deactivated"] },
});

DeviceSchema.index({ licenseKey: 1, deviceFingerprint: 1 }, { unique: true });

export default mongoose.models.Device || mongoose.model("Device", DeviceSchema);

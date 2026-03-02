import mongoose from "mongoose";

const HospitalSchema = new mongoose.Schema({
  licenseKey: { type: String, required: true, unique: true },
  hospitalName: { type: String, required: true },
  hospitalAddress: { type: String, default: "" },
  hospitalPhone: { type: String, default: "" },
  headDoctorName: { type: String, default: "" },
  responsiblePersonName: { type: String, default: "" },
  maxDevicesAllowed: { type: Number, required: true, default: 1 },
  licenseType: {
    type: String,
    enum: ["Starter", "Standard", "Premium"],
    default: "Starter",
  },
  notes: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  signedLicenseToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Hospital || mongoose.model("Hospital", HospitalSchema);

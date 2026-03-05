const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: { type: String },
    registrationNumber: { type: String },
    contactPerson: { type: String },
    industryType: { type: String },
    procurementCategories: [{ type: String }],
    annualRequirement: { type: Number },

    // --- Structured location (used for logistics estimates) ---
    address: { type: String }, // street / building address
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // Legacy / derived text summary
    headOfficeLocation: { type: String },

    procurementRegion: [{ type: String }],
    logo: { type: String },
    gstin: { type: String },
    website: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Buyer", buyerSchema);

const mongoose = require("mongoose");

/**
 * HistoricalCropData
 * ------------------
 * Stores previous-year (or multi-year) crop production records at the
 * farm / survey-village level.  Used to generate "hotspot" maps for buyers
 * so they can identify regions where a given crop was widely grown.
 */
const historicalCropDataSchema = new mongoose.Schema(
  {
    cropName: { type: String, required: true },
    variety: { type: String, default: "" },
    acres: { type: Number, required: true }, // farm area in acres
    quintalsProduced: { type: Number, required: true }, // actual harvest in quintals
    yieldPerAcre: { type: Number, required: true }, // quintals per acre
    village: { type: String, required: true },
    taluk: { type: String, default: "" },
    district: { type: String, required: true },
    state: { type: String, default: "Tamil Nadu" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    season: {
      type: String,
      enum: ["Kharif", "Rabi", "Zaid", "Annual"],
      default: "Kharif",
    },
    year: { type: Number, required: true, default: 2025 },
  },
  { timestamps: false, collection: "historicalcropdata" },
);

// Compound indexes for the hotspot aggregation queries
historicalCropDataSchema.index({ cropName: 1, year: 1 });
historicalCropDataSchema.index({ cropName: 1, variety: 1, district: 1 });
historicalCropDataSchema.index({ district: 1, year: 1 });

module.exports = mongoose.model("HistoricalCropData", historicalCropDataSchema);

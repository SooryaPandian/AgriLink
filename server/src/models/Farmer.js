const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  address: { type: String },
  district: { type: String },
  state: { type: String },
  farm: {
    location: { type: String },
    totalLandArea: { type: Number }, // in acres
    soilType: { type: String },
    irrigationAvailable: { type: Boolean, default: false },
    previousCrops: [{ type: String }],
    cropCapacity: { type: Number }, // in quintals per season
  },
  bank: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
  },
  photos: [{ type: String }],
  certifications: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  completedContracts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);

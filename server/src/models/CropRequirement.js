const mongoose = require('mongoose');

const cropRequirementSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
  cropName: { type: String, required: true },
  variety: { type: String },
  requiredQuantity: { type: Number, required: true }, // in quintals
  qualityGrade: { type: String, enum: ['A', 'B', 'C', 'organic'], default: 'A' },
  plantingDate: { type: Date },
  harvestDate: { type: Date },
  deliveryDate: { type: Date },
  targetRegion: { type: String },
  allowedDistricts: [{ type: String }],
  minFarmSize: { type: Number }, // acres
  requiredCertifications: [{ type: String }],
  farmingPractices: { type: String },
  initialPriceExpectation: { type: Number }, // per quintal
  negotiationAllowed: { type: Boolean, default: true },
  pickupOrDelivery: { type: String, enum: ['pickup', 'delivery', 'both'], default: 'pickup' },
  transportResponsibility: { type: String, enum: ['buyer', 'farmer', 'shared'], default: 'buyer' },
  status: {
    type: String,
    enum: ['open', 'negotiating', 'contracts_allocated', 'fulfilled', 'cancelled'],
    default: 'open',
  },
  applicationCount: { type: Number, default: 0 },
  negotiationSession: { type: mongoose.Schema.Types.ObjectId, ref: 'NegotiationSession' },
}, { timestamps: true });

cropRequirementSchema.index({ status: 1, targetRegion: 1 });
cropRequirementSchema.index({ buyer: 1 });

module.exports = mongoose.model('CropRequirement', cropRequirementSchema);

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'CropRequirement', required: true },
  cropProductionCapacity: { type: Number, required: true }, // quintals
  availableLandArea: { type: Number, required: true }, // acres
  expectedPrice: { type: Number, required: true }, // per quintal
  estimatedProductionQuantity: { type: Number, required: true }, // quintals
  status: {
    type: String,
    enum: ['pending', 'in_negotiation', 'contract_offered', 'contracted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  negotiationPrices: [{
    round: Number,
    price: Number,
    action: { type: String, enum: ['accept', 'counter'] },
    timestamp: Date,
  }],
  finalAcceptedPrice: { type: Number },
  score: { type: Number, default: 0 }, // ranking score for contract allocation
}, { timestamps: true });

applicationSchema.index({ requirement: 1, status: 1 });
applicationSchema.index({ farmer: 1 });

module.exports = mongoose.model('Application', applicationSchema);

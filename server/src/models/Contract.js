const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'CropRequirement', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agreedPrice: { type: Number, required: true },
  contractedQuantity: { type: Number, required: true },
  deliveryDate: { type: Date },
  terms: { type: String },
  status: {
    type: String,
    enum: ['invited', 'accepted', 'rejected', 'expired', 'fulfilled', 'cancelled'],
    default: 'invited',
  },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  expiresAt: { type: Date },
  rejectedReason: { type: String },
}, { timestamps: true });

contractSchema.index({ farmer: 1, status: 1 });
contractSchema.index({ requirement: 1 });

module.exports = mongoose.model('Contract', contractSchema);

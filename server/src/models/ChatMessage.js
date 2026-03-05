const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  negotiationSession: { type: mongoose.Schema.Types.ObjectId, ref: 'NegotiationSession', required: true },
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'CropRequirement' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderRole: { type: String, enum: ['farmer', 'buyer', 'system'] },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'system', 'price_proposal'], default: 'text' },
  priceData: {
    proposedPrice: Number,
    round: Number,
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

chatMessageSchema.index({ negotiationSession: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

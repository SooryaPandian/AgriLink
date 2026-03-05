const mongoose = require('mongoose');

const negotiationRoundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  proposedPrice: { type: Number, required: true }, // system-calculated optimal price
  buyerAction: { type: String, enum: ['pending', 'accepted', 'countered'] },
  buyerCounterPrice: { type: Number },
  buyerNote: { type: String },
  farmerResponses: [{
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    action: { type: String, enum: ['pending', 'accepted', 'countered'] },
    counterPrice: { type: Number },
    respondedAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

const negotiationSessionSchema = new mongoose.Schema({
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'CropRequirement', required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rounds: [negotiationRoundSchema],
  currentRound: { type: Number, default: 1 },
  meanPrice: { type: Number },
  medianPrice: { type: Number },
  optimalPrice: { type: Number },
  finalAgreedPrice: { type: Number },
  status: {
    type: String,
    enum: ['open', 'buyer_review', 'farmer_review', 'agreed', 'closed'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('NegotiationSession', negotiationSessionSchema);

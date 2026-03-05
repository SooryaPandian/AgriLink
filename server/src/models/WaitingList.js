const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'CropRequirement', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  position: { type: Number, required: true },
  score: { type: Number, default: 0 },
  acceptedPrice: { type: Number },
  status: {
    type: String,
    enum: ['waiting', 'promoted', 'expired', 'withdrawn'],
    default: 'waiting',
  },
}, { timestamps: true });

waitingListSchema.index({ requirement: 1, position: 1 });

module.exports = mongoose.model('WaitingList', waitingListSchema);

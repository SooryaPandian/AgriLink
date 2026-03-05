const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String },
  registrationNumber: { type: String },
  contactPerson: { type: String },
  industryType: { type: String },
  procurementCategories: [{ type: String }],
  annualRequirement: { type: Number },
  address: { type: String },
  headOfficeLocation: { type: String },
  procurementRegion: [{ type: String }],
  logo: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Buyer', buyerSchema);

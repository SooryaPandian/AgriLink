const express = require('express');
const Farmer = require('../models/Farmer');
const CropRequirement = require('../models/CropRequirement');
const Application = require('../models/Application');
const NegotiationSession = require('../models/NegotiationSession');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { createAndEmitNotification } = require('../utils/notificationHelper');

const router = express.Router();

// All farmer routes require auth + farmer role
router.use(authenticateToken, requireRole('farmer'));

// GET /api/farmers/profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await Farmer.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/farmers/profile
router.put('/profile', async (req, res) => {
  try {
    let profile = await Farmer.findOne({ user: req.user._id });
    if (profile) {
      profile = await Farmer.findOneAndUpdate({ user: req.user._id }, req.body, { new: true, runValidators: true });
    } else {
      profile = await Farmer.create({ user: req.user._id, ...req.body });
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/farmers/requirements - Browse open requirements
router.get('/requirements', async (req, res) => {
  try {
    const { district, crop, page = 1, limit = 20 } = req.query;
    const filter = { status: 'open' };
    if (district) filter.allowedDistricts = { $in: [district] };
    if (crop) filter.cropName = { $regex: crop, $options: 'i' };

    const requirements = await CropRequirement.find(filter)
      .populate('buyer', 'name email')
      .populate('buyerProfile', 'companyName industryType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CropRequirement.countDocuments(filter);
    res.json({ success: true, requirements, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/farmers/requirements/:id
router.get('/requirements/:id', async (req, res) => {
  try {
    const requirement = await CropRequirement.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('buyerProfile');
    if (!requirement) return res.status(404).json({ success: false, message: 'Requirement not found' });

    // Check if farmer already applied
    const existingApp = await Application.findOne({ farmer: req.user._id, requirement: req.params.id });
    res.json({ success: true, requirement, existingApplication: existingApp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/farmers/requirements/:id/apply
router.post('/requirements/:id/apply', async (req, res) => {
  try {
    const { cropProductionCapacity, availableLandArea, expectedPrice, estimatedProductionQuantity } = req.body;
    const requirement = await CropRequirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ success: false, message: 'Requirement not found' });
    if (requirement.status !== 'open') return res.status(400).json({ success: false, message: 'This requirement is no longer open' });

    const existing = await Application.findOne({ farmer: req.user._id, requirement: req.params.id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied for this requirement' });

    const farmerProfile = await Farmer.findOne({ user: req.user._id });
    const application = await Application.create({
      farmer: req.user._id,
      farmerProfile: farmerProfile?._id,
      requirement: req.params.id,
      cropProductionCapacity,
      availableLandArea,
      expectedPrice,
      estimatedProductionQuantity,
    });

    await CropRequirement.findByIdAndUpdate(req.params.id, { $inc: { applicationCount: 1 } });

    // Notify buyer
    const io = req.app.get('io');
    await createAndEmitNotification(io, {
      recipient: requirement.buyer,
      type: 'application_accepted',
      title: 'New Farmer Application',
      message: `A farmer applied for your "${requirement.cropName}" requirement with expected price ₹${expectedPrice}/quintal.`,
      relatedId: requirement._id,
      relatedModel: 'CropRequirement',
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/farmers/applications - My applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find({ farmer: req.user._id })
      .populate('requirement', 'cropName variety requiredQuantity status buyer deliveryDate initialPriceExpectation')
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/farmers/contracts - My contracts
router.get('/contracts', async (req, res) => {
  try {
    const Contract = require('../models/Contract');
    const contracts = await Contract.find({ farmer: req.user._id })
      .populate('requirement', 'cropName variety deliveryDate targetRegion')
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

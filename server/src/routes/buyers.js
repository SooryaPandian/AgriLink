const express = require('express');
const Buyer = require('../models/Buyer');
const CropRequirement = require('../models/CropRequirement');
const Application = require('../models/Application');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { createAndEmitNotification } = require('../utils/notificationHelper');

const router = express.Router();

router.use(authenticateToken, requireRole('buyer'));

// GET /api/buyers/profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await Buyer.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/buyers/profile
router.put('/profile', async (req, res) => {
  try {
    let profile = await Buyer.findOne({ user: req.user._id });
    if (profile) {
      profile = await Buyer.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
    } else {
      profile = await Buyer.create({ user: req.user._id, ...req.body });
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/buyers/requirements
router.post('/requirements', async (req, res) => {
  try {
    const buyerProfile = await Buyer.findOne({ user: req.user._id });
    const requirement = await CropRequirement.create({
      buyer: req.user._id,
      buyerProfile: buyerProfile?._id,
      ...req.body,
    });
    res.status(201).json({ success: true, requirement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/requirements
router.get('/requirements', async (req, res) => {
  try {
    const requirements = await CropRequirement.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requirements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/requirements/:id
router.get('/requirements/:id', async (req, res) => {
  try {
    const requirement = await CropRequirement.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!requirement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, requirement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/requirements/:id/applications
router.get('/requirements/:id/applications', async (req, res) => {
  try {
    const applications = await Application.find({ requirement: req.params.id })
      .populate('farmer', 'name email phone')
      .populate('farmerProfile', 'farm district state rating completedContracts')
      .sort({ expectedPrice: 1 });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/dashboard - Analytics
router.get('/dashboard', async (req, res) => {
  try {
    const requirements = await CropRequirement.find({ buyer: req.user._id });
    const reqIds = requirements.map((r) => r._id);

    const applications = await Application.find({ requirement: { $in: reqIds } });
    const avgPrice =
      applications.length > 0
        ? applications.reduce((s, a) => s + a.expectedPrice, 0) / applications.length
        : 0;

    const Contract = require('../models/Contract');
    const contracts = await Contract.find({ buyer: req.user._id });
    const acceptedContracts = contracts.filter((c) => c.status === 'accepted').length;

    res.json({
      success: true,
      analytics: {
        totalRequirements: requirements.length,
        openRequirements: requirements.filter((r) => r.status === 'open').length,
        totalApplications: applications.length,
        averageFarmerPrice: parseFloat(avgPrice.toFixed(2)),
        totalContracts: contracts.length,
        acceptedContracts,
        fulfilmentRate: contracts.length > 0 ? parseFloat(((acceptedContracts / contracts.length) * 100).toFixed(1)) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

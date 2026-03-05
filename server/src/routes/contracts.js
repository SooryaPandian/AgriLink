const express = require('express');
const Contract = require('../models/Contract');
const Application = require('../models/Application');
const { authenticateToken } = require('../middleware/auth');
const { promoteFromWaitingList } = require('../utils/contractAllocator');
const { createAndEmitNotification } = require('../utils/notificationHelper');

const router = express.Router();
router.use(authenticateToken);

// GET /api/contracts - Get all contracts for current user
router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'buyer' ? { buyer: req.user._id } : { farmer: req.user._id };
    const contracts = await Contract.find(filter)
      .populate('requirement', 'cropName variety deliveryDate targetRegion allowedDistricts')
      .populate('farmer', 'name email phone')
      .populate('buyer', 'name email')
      .populate('farmerProfile', 'farm district state')
      .sort({ createdAt: -1 });
    res.json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/contracts/waiting-list/:requirementId - Get waiting list for a requirement (buyer)
router.get('/waiting-list/:requirementId', async (req, res) => {
  try {
    const WaitingList = require('../models/WaitingList');
    const waiting = await WaitingList.find({ requirement: req.params.requirementId })
      .populate('farmer', 'name email phone')
      .populate('application')
      .sort({ position: 1 });
    res.json({ success: true, waitingList: waiting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/contracts/:id/respond - Farmer accepts or rejects contract
router.post('/:id/respond', async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'accept' | 'reject'
    const contract = await Contract.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    if (contract.status !== 'invited') return res.status(400).json({ success: false, message: 'Contract already responded to' });

    const io = req.app.get('io');
    const requirement = await require('../models/CropRequirement').findById(contract.requirement);

    if (action === 'accept') {
      contract.status = 'accepted';
      contract.acceptedAt = new Date();
      await contract.save();

      await Application.findByIdAndUpdate(contract.application, { status: 'contracted' });

      await createAndEmitNotification(io, {
        recipient: contract.buyer,
        type: 'contract_accepted',
        title: 'Contract Accepted!',
        message: `Farmer accepted the contract for "${requirement?.cropName}". Contract is now active.`,
        relatedId: contract._id,
        relatedModel: 'Contract',
      });
    } else if (action === 'reject') {
      contract.status = 'rejected';
      contract.rejectedReason = reason;
      await contract.save();

      await Application.findByIdAndUpdate(contract.application, { status: 'rejected' });

      await createAndEmitNotification(io, {
        recipient: contract.buyer,
        type: 'contract_rejected',
        title: 'Contract Rejected',
        message: `A farmer declined the contract for "${requirement?.cropName}". Promoting next waiting list farmer.`,
        relatedId: contract._id,
        relatedModel: 'Contract',
      });

      // Auto-promote next from waiting list
      await promoteFromWaitingList(contract.requirement, io);
    }

    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

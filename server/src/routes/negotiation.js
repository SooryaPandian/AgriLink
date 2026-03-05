const express = require('express');
const NegotiationSession = require('../models/NegotiationSession');
const Application = require('../models/Application');
const CropRequirement = require('../models/CropRequirement');
const ChatMessage = require('../models/ChatMessage');
const { authenticateToken } = require('../middleware/auth');
const { calculateOptimalPrice, recalculateAfterFarmerRound } = require('../utils/negotiationEngine');
const { allocateContracts } = require('../utils/contractAllocator');
const { createAndEmitNotification } = require('../utils/notificationHelper');

const router = express.Router();
router.use(authenticateToken);

// GET /api/negotiation/:requirementId
router.get('/:requirementId', async (req, res) => {
  try {
    const session = await NegotiationSession.findOne({ requirement: req.params.requirementId })
      .populate('requirement')
      .populate('rounds.farmerResponses.farmer', 'name email');
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/negotiation/:requirementId/start (buyer initiates negotiation)
router.post('/:requirementId/start', async (req, res) => {
  try {
    const requirement = await CropRequirement.findOne({ _id: req.params.requirementId, buyer: req.user._id });
    if (!requirement) return res.status(404).json({ success: false, message: 'Requirement not found' });

    const existingSession = await NegotiationSession.findOne({ requirement: req.params.requirementId });
    if (existingSession) return res.status(400).json({ success: false, message: 'Negotiation session already exists' });

    // Get all pending applications
    const applications = await Application.find({ requirement: req.params.requirementId, status: 'pending' });
    if (applications.length === 0) return res.status(400).json({ success: false, message: 'No applications to negotiate with' });

    const prices = applications.map((a) => a.expectedPrice);
    const { mean, median, optimalPrice } = calculateOptimalPrice(prices);

    const farmerResponses = applications.map((a) => ({
      farmer: a.farmer,
      application: a._id,
      action: 'pending',
    }));

    const session = await NegotiationSession.create({
      requirement: req.params.requirementId,
      buyer: req.user._id,
      meanPrice: mean,
      medianPrice: median,
      optimalPrice,
      currentRound: 1,
      status: 'buyer_review',
      rounds: [{
        roundNumber: 1,
        proposedPrice: optimalPrice,
        buyerAction: 'pending',
        farmerResponses,
      }],
    });

    await CropRequirement.findByIdAndUpdate(req.params.requirementId, {
      status: 'negotiating',
      negotiationSession: session._id,
    });
    await Application.updateMany({ requirement: req.params.requirementId, status: 'pending' }, { status: 'in_negotiation' });

    // Post system message to chat
    await ChatMessage.create({
      negotiationSession: session._id,
      requirement: req.params.requirementId,
      senderRole: 'system',
      text: `Negotiation started. Optimal price calculated: ₹${optimalPrice}/quintal (Mean: ₹${mean}, Median: ₹${median})`,
      type: 'system',
      priceData: { proposedPrice: optimalPrice, round: 1 },
    });

    const io = req.app.get('io');
    // Notify all applying farmers
    for (const app of applications) {
      await createAndEmitNotification(io, {
        recipient: app.farmer,
        type: 'negotiation_update',
        title: 'Negotiation Started',
        message: `The buyer has started negotiation for "${requirement.cropName}". Optimal price: ₹${optimalPrice}/quintal.`,
        relatedId: session._id,
        relatedModel: 'NegotiationSession',
      });
    }

    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/negotiation/:requirementId/buyer-action (buyer accepts optimal price or sends counter)
router.post('/:requirementId/buyer-action', async (req, res) => {
  try {
    const { action, counterPrice, note } = req.body; // action: 'accept' | 'counter'
    const session = await NegotiationSession.findOne({ requirement: req.params.requirementId });
    if (!session || session.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const requirement = await CropRequirement.findById(req.params.requirementId);
    const currentRound = session.rounds[session.currentRound - 1];

    if (action === 'accept') {
      // Buyer accepts the optimal price as-is → finalize
      currentRound.buyerAction = 'accepted';
      session.finalAgreedPrice = currentRound.proposedPrice;
      session.status = 'agreed';
      await session.save();

      await ChatMessage.create({
        negotiationSession: session._id,
        requirement: session.requirement,
        senderRole: 'system',
        text: `Buyer accepted the price of ₹${currentRound.proposedPrice}/quintal. Contracts will be allocated shortly.`,
        type: 'system',
      });

      // Allocate contracts
      const applications = await Application.find({ requirement: req.params.requirementId, status: 'in_negotiation' });
      const io = req.app.get('io');
      await allocateContracts(requirement, applications, session.finalAgreedPrice, io);
      await CropRequirement.findByIdAndUpdate(req.params.requirementId, { status: 'contracts_allocated' });

      return res.json({ success: true, session, message: 'Price accepted, contracts allocated' });
    } else if (action === 'counter') {
      if (!counterPrice) return res.status(400).json({ success: false, message: 'counterPrice required' });
      currentRound.buyerAction = 'countered';
      currentRound.buyerCounterPrice = counterPrice;
      currentRound.buyerNote = note;
      session.status = 'farmer_review';
      await session.save();

      const io = req.app.get('io');
      const applications = await Application.find({ requirement: req.params.requirementId, status: 'in_negotiation' });

      await ChatMessage.create({
        negotiationSession: session._id,
        requirement: session.requirement,
        sender: req.user._id,
        senderRole: 'buyer',
        text: `Buyer sent a counter offer of ₹${counterPrice}/quintal. ${note || ''}`,
        type: 'price_proposal',
        priceData: { proposedPrice: counterPrice, round: session.currentRound },
      });

      for (const app of applications) {
        await createAndEmitNotification(req.app.get('io'), {
          recipient: app.farmer,
          type: 'buyer_counter',
          title: 'Buyer Counter Offer',
          message: `The buyer countered with ₹${counterPrice}/quintal for "${requirement.cropName}". Please respond.`,
          relatedId: session._id,
          relatedModel: 'NegotiationSession',
        });
      }

      return res.json({ success: true, session, message: 'Counter offer sent to farmers' });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/negotiation/:requirementId/farmer-action (farmer accepts or counter-offers buyer's price)
router.post('/:requirementId/farmer-action', async (req, res) => {
  try {
    const { action, counterPrice } = req.body;
    const session = await NegotiationSession.findOne({ requirement: req.params.requirementId });
    if (!session) return res.status(404).json({ success: false, message: 'Negotiation session not found' });

    const application = await Application.findOne({ farmer: req.user._id, requirement: req.params.requirementId });
    if (!application) return res.status(403).json({ success: false, message: 'No application found' });

    const currentRound = session.rounds[session.currentRound - 1];
    const farmerEntry = currentRound.farmerResponses.find(
      (r) => r.farmer.toString() === req.user._id.toString()
    );
    if (!farmerEntry) return res.status(404).json({ success: false, message: 'Farmer response slot not found' });

    farmerEntry.action = action;
    farmerEntry.counterPrice = action === 'counter' ? counterPrice : null;
    farmerEntry.respondedAt = new Date();

    // Record in application
    application.negotiationPrices.push({
      round: session.currentRound,
      price: action === 'accepted' ? currentRound.buyerCounterPrice : counterPrice,
      action,
      timestamp: new Date(),
    });
    await application.save();

    // Check if all farmers have responded
    const allResponded = currentRound.farmerResponses.every((r) => r.action !== 'pending');
    if (allResponded) {
      // Recalculate optimal price for next buyer review
      const { optimalPrice, mean, median } = recalculateAfterFarmerRound(
        currentRound.farmerResponses,
        currentRound.buyerCounterPrice || currentRound.proposedPrice
      );

      // Start new round
      const newRound = {
        roundNumber: session.currentRound + 1,
        proposedPrice: optimalPrice,
        buyerAction: 'pending',
        farmerResponses: currentRound.farmerResponses.map((r) => ({
          farmer: r.farmer,
          application: r.application,
          action: 'pending',
        })),
      };

      session.currentRound += 1;
      session.meanPrice = mean;
      session.medianPrice = median;
      session.optimalPrice = optimalPrice;
      session.rounds.push(newRound);
      session.status = 'buyer_review';

      await ChatMessage.create({
        negotiationSession: session._id,
        requirement: session.requirement,
        senderRole: 'system',
        text: `All farmers responded. New optimal price: ₹${optimalPrice}/quintal (Round ${session.currentRound}).`,
        type: 'system',
        priceData: { proposedPrice: optimalPrice, round: session.currentRound },
      });

      const requirement = await CropRequirement.findById(req.params.requirementId);
      await createAndEmitNotification(req.app.get('io'), {
        recipient: session.buyer,
        type: 'farmer_response',
        title: 'All Farmers Responded',
        message: `All farmers responded to your counter in Round ${session.currentRound - 1}. New optimal price: ₹${optimalPrice}/quintal.`,
        relatedId: session._id,
        relatedModel: 'NegotiationSession',
      });
    }

    await session.save();
    res.json({ success: true, session, message: allResponded ? 'Round complete, awaiting buyer review' : 'Response recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

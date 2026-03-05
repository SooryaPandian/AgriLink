const Contract = require('../models/Contract');
const WaitingList = require('../models/WaitingList');
const Application = require('../models/Application');
const Farmer = require('../models/Farmer');
const { createAndEmitNotification } = require('./notificationHelper');

/**
 * Score a farmer application for ranking.
 * Criteria: lowest accepted price (40%), production capacity (30%), rating (20%), geo (10%)
 */
function scoreApplication(app, agreedPrice, farmerProfile, maxCapacity) {
  const priceScore = agreedPrice > 0 ? Math.max(0, 100 - (agreedPrice / 10)) : 0;
  const capacityScore = maxCapacity > 0 ? (app.estimatedProductionQuantity / maxCapacity) * 100 : 0;
  const ratingScore = farmerProfile ? (farmerProfile.rating / 5) * 100 : 50;
  const score = 0.4 * priceScore + 0.3 * capacityScore + 0.2 * ratingScore + 0.1 * 50;
  return parseFloat(score.toFixed(2));
}

/**
 * Allocate contracts after price finalization.
 * @param {Object} requirement - The CropRequirement document
 * @param {Array} applications - Array of Application documents with status in_negotiation
 * @param {Number} agreedPrice - Final agreed price per quintal
 * @param {Object} io - Socket.io instance for notifications
 */
async function allocateContracts(requirement, applications, agreedPrice, io) {
  const maxCapacity = Math.max(...applications.map((a) => a.estimatedProductionQuantity));

  // Get farmer profiles for rating
  const farmerProfiles = {};
  await Promise.all(
    applications.map(async (app) => {
      const fp = await Farmer.findOne({ user: app.farmer });
      farmerProfiles[app.farmer.toString()] = fp;
    })
  );

  // Score and sort applications
  const scored = applications.map((app) => ({
    app,
    score: scoreApplication(app, agreedPrice, farmerProfiles[app.farmer.toString()], maxCapacity),
  })).sort((a, b) => b.score - a.score);

  let quantityFilled = 0;
  const requiredQty = requirement.requiredQuantity;
  const primaryFarmers = [];
  const waitingListFarmers = [];

  for (const { app, score } of scored) {
    app.score = score;
    if (quantityFilled < requiredQty && app.status !== 'rejected') {
      primaryFarmers.push(app);
      quantityFilled += app.estimatedProductionQuantity;
    } else {
      waitingListFarmers.push(app);
    }
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours to accept

  // Create contracts for primary farmers
  for (const app of primaryFarmers) {
    const contract = await Contract.create({
      requirement: requirement._id,
      application: app._id,
      farmer: app.farmer,
      farmerProfile: app.farmerProfile,
      buyer: requirement.buyer,
      agreedPrice,
      contractedQuantity: app.estimatedProductionQuantity,
      deliveryDate: requirement.deliveryDate,
      status: 'invited',
      invitedAt: new Date(),
      expiresAt,
    });

    await Application.findByIdAndUpdate(app._id, {
      status: 'contract_offered',
      finalAcceptedPrice: agreedPrice,
    });

    await createAndEmitNotification(io, {
      recipient: app.farmer,
      type: 'contract_invitation',
      title: '🎉 Contract Invitation!',
      message: `You have been selected for "${requirement.cropName}" contract at ₹${agreedPrice}/quintal. Accept within 72 hours.`,
      relatedId: contract._id,
      relatedModel: 'Contract',
    });
  }

  // Create waiting list entries
  for (let i = 0; i < waitingListFarmers.length; i++) {
    const app = waitingListFarmers[i];
    await WaitingList.create({
      requirement: requirement._id,
      application: app._id,
      farmer: app.farmer,
      position: i + 1,
      score: app.score,
      acceptedPrice: agreedPrice,
      status: 'waiting',
    });

    await createAndEmitNotification(io, {
      recipient: app.farmer,
      type: 'negotiation_update',
      title: 'You are on the waiting list',
      message: `You have been added to the waiting list (position ${i + 1}) for "${requirement.cropName}". You may be promoted if primary farmers decline.`,
      relatedId: requirement._id,
      relatedModel: 'CropRequirement',
    });
  }

  return { primaryCount: primaryFarmers.length, waitingCount: waitingListFarmers.length };
}

/**
 * Promote next waiting list farmer when a primary farmer rejects their contract.
 */
async function promoteFromWaitingList(requirementId, io) {
  const nextEntry = await WaitingList.findOne({
    requirement: requirementId,
    status: 'waiting',
  }).sort({ position: 1 });

  if (!nextEntry) return null;

  const application = await Application.findById(nextEntry.application);
  if (!application) return null;

  const agreedPrice = nextEntry.acceptedPrice;
  const requirement = await require('../models/CropRequirement').findById(requirementId);

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const contract = await Contract.create({
    requirement: requirementId,
    application: nextEntry.application,
    farmer: nextEntry.farmer,
    buyer: requirement.buyer,
    agreedPrice,
    contractedQuantity: application.estimatedProductionQuantity,
    deliveryDate: requirement.deliveryDate,
    status: 'invited',
    invitedAt: new Date(),
    expiresAt,
  });

  await Application.findByIdAndUpdate(nextEntry.application, { status: 'contract_offered' });
  await WaitingList.findByIdAndUpdate(nextEntry._id, { status: 'promoted' });

  await createAndEmitNotification(io, {
    recipient: nextEntry.farmer,
    type: 'contract_invitation',
    title: '🎉 Contract Offer – Waiting List Promotion!',
    message: `Good news! A spot opened up and you are now offered a contract for "${requirement.cropName}" at ₹${agreedPrice}/quintal.`,
    relatedId: contract._id,
    relatedModel: 'Contract',
  });

  return contract;
}

module.exports = { allocateContracts, promoteFromWaitingList };

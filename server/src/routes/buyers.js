const express = require("express");
const Buyer = require("../models/Buyer");
const CropRequirement = require("../models/CropRequirement");
const Application = require("../models/Application");
const HistoricalCropData = require("../models/HistoricalCropData");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleCheck");
const { createAndEmitNotification } = require("../utils/notificationHelper");
const { estimateLogistics } = require("../utils/logisticsEstimator");

const router = express.Router();

router.use(authenticateToken, requireRole("buyer"));

// Whitelisted profile fields (prevents mass-assignment of sensitive keys)
const PROFILE_FIELDS = [
  "companyName",
  "registrationNumber",
  "contactPerson",
  "industryType",
  "procurementCategories",
  "annualRequirement",
  "address",
  "city",
  "state",
  "pincode",
  "headOfficeLocation",
  "procurementRegion",
  "gstin",
  "website",
  "logo",
];

// GET /api/buyers/profile
router.get("/profile", async (req, res) => {
  try {
    const profile = await Buyer.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/buyers/profile
router.put("/profile", async (req, res) => {
  try {
    // Pick only whitelisted fields
    const update = {};
    for (const key of PROFILE_FIELDS) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    // Keep headOfficeLocation in sync as a readable summary
    if (update.city || update.state) {
      const city = update.city || "";
      const state = update.state || "";
      update.headOfficeLocation = [city, state].filter(Boolean).join(", ");
    }

    let profile = await Buyer.findOneAndUpdate({ user: req.user._id }, update, {
      new: true,
      upsert: true,
    });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/logistics-estimate
// Query params: farmerState, farmerDistrict, quantity (quintals)
router.get("/logistics-estimate", async (req, res) => {
  try {
    const profile = await Buyer.findOne({ user: req.user._id });
    const buyerState = profile?.state || "";

    const { farmerState = "", quantity = 1 } = req.query;

    if (!buyerState) {
      return res.status(400).json({
        success: false,
        message: "Update your company state in your profile first.",
      });
    }
    if (!farmerState) {
      return res.status(400).json({
        success: false,
        message: "farmerState query param is required.",
      });
    }

    const estimate = estimateLogistics(
      buyerState,
      farmerState,
      Number(quantity),
    );
    res.json({ success: true, buyerState, farmerState, ...estimate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/buyers/requirements
router.post("/requirements", async (req, res) => {
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
router.get("/requirements", async (req, res) => {
  try {
    const requirements = await CropRequirement.find({
      buyer: req.user._id,
    }).sort({ createdAt: -1 });
    res.json({ success: true, requirements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/requirements/:id
router.get("/requirements/:id", async (req, res) => {
  try {
    const requirement = await CropRequirement.findOne({
      _id: req.params.id,
      buyer: req.user._id,
    });
    if (!requirement)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, requirement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/requirements/:id/applications
router.get("/requirements/:id/applications", async (req, res) => {
  try {
    const applications = await Application.find({ requirement: req.params.id })
      .populate("farmer", "name email phone")
      .populate(
        "farmerProfile",
        "farm district state rating completedContracts",
      )
      .sort({ expectedPrice: 1 });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/buyers/hotspots
// Query params:
//   cropName  (required)  – e.g. "Turmeric"
//   variety   (optional)  – e.g. "Erode Local"
//   year      (optional)  – defaults to 2025
//   district  (optional)  – restrict to one district
//
// Returns hotspot clusters aggregated by village × district with:
//   avgYieldPerAcre, totalAcres, totalQuintals, farmCount, lat, lng, varieties
// ─────────────────────────────────────────────────────────────────────────────
router.get("/hotspots", async (req, res) => {
  try {
    const { cropName, variety, year, district } = req.query;
    if (!cropName || !cropName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "cropName query param is required" });
    }

    const matchStage = {
      cropName: { $regex: new RegExp(`^${cropName.trim()}$`, "i") },
      year: parseInt(year, 10) || 2025,
    };
    if (variety && variety.trim()) {
      matchStage.variety = { $regex: new RegExp(`^${variety.trim()}$`, "i") };
    }
    if (district && district.trim()) {
      matchStage.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
    }

    // Accept two optional parameters from client to help select hotspots:
    //  - requiredQuantity: how many quintals the buyer needs
    //  - proximityKm: maximum allowed farm spread in the hotspot (km)
    const requiredQuantity = parseFloat(req.query.requiredQuantity) || 0;
    const proximityKm = parseFloat(req.query.proximityKm) || 0;

    const hotspotsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { village: "$village", district: "$district", taluk: "$taluk" },
          avgYieldPerAcre: { $avg: "$yieldPerAcre" },
          totalAcres: { $sum: "$acres" },
          totalQuintals: { $sum: "$quintalsProduced" },
          farmCount: { $sum: 1 },
          avgLat: { $avg: "$lat" },
          avgLng: { $avg: "$lng" },
          minLat: { $min: "$lat" },
          maxLat: { $max: "$lat" },
          minLng: { $min: "$lng" },
          maxLng: { $max: "$lng" },
          varieties: { $addToSet: "$variety" },
          state: { $first: "$state" },
        },
      },
      {
        $project: {
          _id: 0,
          village: "$_id.village",
          taluk: "$_id.taluk",
          district: "$_id.district",
          state: 1,
          lat: { $round: ["$avgLat", 6] },
          lng: { $round: ["$avgLng", 6] },
          latRange: { $abs: { $subtract: ["$maxLat", "$minLat"] } },
          lngRange: { $abs: { $subtract: ["$maxLng", "$minLng"] } },
          avgYieldPerAcre: { $round: ["$avgYieldPerAcre", 2] },
          totalAcres: { $round: ["$totalAcres", 2] },
          totalQuintals: { $round: ["$totalQuintals", 2] },
          farmCount: 1,
          varieties: 1,
        },
      },
      // Compute an approximate farm spread (km) using degree -> km conversion.
      // latitude: ~111 km per degree; longitude scaled by cos(latitude).
      {
        $addFields: {
          latRangeKm: { $multiply: ["$latRange", 111] },
          lngRangeKm: {
            $multiply: [
              "$lngRange",
              111,
              {
                $cos: {
                  $multiply: ["$lat", { $divide: [3.141592653589793, 180] }],
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          farmSpreadKm: {
            $round: [
              {
                $sqrt: {
                  $add: [
                    { $multiply: ["$latRangeKm", "$latRangeKm"] },
                    { $multiply: ["$lngRangeKm", "$lngRangeKm"] },
                  ],
                },
              },
              2,
            ],
          },
        },
      },
      // Mark whether the hotspot alone satisfies the requested quantity
      {
        $addFields: {
          satisfies: { $gte: ["$totalQuintals", requiredQuantity] },
        },
      },
    ];

    // If proximityKm was provided, filter hotspots by farmSpreadKm
    if (proximityKm > 0) {
      hotspotsPipeline.push({
        $match: { farmSpreadKm: { $lte: proximityKm } },
      });
    }

    hotspotsPipeline.push({ $sort: { totalAcres: -1 } });

    const hotspots = await HistoricalCropData.aggregate(hotspotsPipeline);

    res.json({
      success: true,
      hotspots,
      cropName: cropName.trim(),
      year: parseInt(year, 10) || 2025,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/hotspots/crops
// Returns the list of distinct crop names (and varieties) present in historical data
router.get("/hotspots/crops", async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || 2025;

    // Use distinct to reliably collect crop names, then fetch varieties & districts per crop.
    // This is more tolerant to minor data variations and avoids aggregation surprises.
    const cropNames = await HistoricalCropData.distinct("cropName", { year });
    console.log("Distinct crop names from DB:", cropNames);

    // Debug: log overall count and a sample doc so we can verify the collection state
    try {
      const totalForYear = await HistoricalCropData.countDocuments({ year });
      console.log(
        `HistoricalCropData documents for year ${year}:`,
        totalForYear,
      );
      const sample = await HistoricalCropData.findOne({ year }).lean();
      console.log("HistoricalCropData sample document:", sample);
    } catch (dbgErr) {
      console.log("Hotspots debug check failed:", dbgErr.message);
    }
    const cleaned = (cropNames || []).filter(
      (c) => c && String(c).trim().length > 0,
    );

    const crops = await Promise.all(
      cleaned.map(async (name) => {
        const varieties = await HistoricalCropData.distinct("variety", {
          cropName: name,
          year,
        });
        const districts = await HistoricalCropData.distinct("district", {
          cropName: name,
          year,
        });
        return {
          cropName: name,
          varieties: (varieties || []).filter(Boolean),
          districts: (districts || []).filter(Boolean),
        };
      }),
    );

    // Sort by cropName for deterministic client ordering
    crops.sort((a, b) => String(a.cropName).localeCompare(String(b.cropName)));
    res.json({ success: true, crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buyers/dashboard - Analytics
router.get("/dashboard", async (req, res) => {
  try {
    const requirements = await CropRequirement.find({ buyer: req.user._id });
    const reqIds = requirements.map((r) => r._id);

    const applications = await Application.find({
      requirement: { $in: reqIds },
    });
    const avgPrice =
      applications.length > 0
        ? applications.reduce((s, a) => s + a.expectedPrice, 0) /
          applications.length
        : 0;

    const Contract = require("../models/Contract");
    const contracts = await Contract.find({ buyer: req.user._id });
    const acceptedContracts = contracts.filter(
      (c) => c.status === "accepted",
    ).length;

    res.json({
      success: true,
      analytics: {
        totalRequirements: requirements.length,
        openRequirements: requirements.filter((r) => r.status === "open")
          .length,
        totalApplications: applications.length,
        averageFarmerPrice: parseFloat(avgPrice.toFixed(2)),
        totalContracts: contracts.length,
        acceptedContracts,
        fulfilmentRate:
          contracts.length > 0
            ? parseFloat(
                ((acceptedContracts / contracts.length) * 100).toFixed(1),
              )
            : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

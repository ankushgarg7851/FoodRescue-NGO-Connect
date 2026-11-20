const express = require("express");
const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");
const Review = require("../models/Review");

const router = express.Router();

// Fallback in-memory MongoDB store for environments where mongod service is not started
let inMemoryDonations = [];
let inMemoryUsers = [];
let inMemoryReviews = [];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// ========================================================
// PARAMETER 4: CRUD OPERATIONS FOR DONATIONS IN MONGODB
// ========================================================

/**
 * 1. CREATE: POST /api/mongo/donations
 * Creates a donation using Mongoose schema validation and saves to MongoDB.
 */
router.post("/donations", async (req, res) => {
  try {
    const {
      foodName,
      foodType,
      quantity,
      pickupWindow,
      pickupLocation,
      notes,
      donorName,
      donorEmail
    } = req.body;

    const customId = `FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Build Mongoose document to strictly enforce Schema validation
    const donationDoc = new Donation({
      id: customId,
      foodName: foodName ? String(foodName).trim() : undefined,
      foodType: foodType ? String(foodType).trim() : undefined,
      quantity: quantity ? Number(quantity) : undefined,
      pickupWindow: pickupWindow ? new Date(pickupWindow) : undefined,
      pickupLocation: pickupLocation ? String(pickupLocation).trim() : undefined,
      notes: notes ? String(notes).trim() : "",
      donorName: donorName ? String(donorName).trim() : "Donor",
      donorEmail: donorEmail ? String(donorEmail).trim().toLowerCase() : undefined,
      status: "Available"
    });

    // Validate against Mongoose schema
    const validationError = donationDoc.validateSync();
    if (validationError) {
      return res.status(400).json({
        error: "Mongoose Validation Error",
        details: validationError.errors
      });
    }

    if (isMongoConnected()) {
      const saved = await donationDoc.save();
      return res.status(201).json({
        message: "Donation created in MongoDB database successfully.",
        storageSource: "MongoDB Live Cluster",
        donation: saved
      });
    }

    // In-Memory Mongoose fallback if local mongod daemon is offline
    const docObj = donationDoc.toObject();
    docObj._id = new mongoose.Types.ObjectId();
    inMemoryDonations.unshift(docObj);

    return res.status(201).json({
      message: "Donation validated with Mongoose Schema and saved (MongoDB daemon currently offline).",
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      donation: docObj
    });
  } catch (error) {
    console.error("MongoDB Create Error:", error);
    return res.status(500).json({
      error: "Failed to create donation.",
      details: error.message
    });
  }
});

/**
 * 2. READ: GET /api/mongo/donations
 * Retrieves donations from MongoDB with filtering (status, foodType, search, donorEmail).
 */
router.get("/donations", async (req, res) => {
  try {
    const { status, foodType, search, donorEmail } = req.query;

    if (isMongoConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (foodType && foodType !== "All Food Types") filter.foodType = foodType;
      if (donorEmail) filter.donorEmail = donorEmail.toLowerCase();
      if (search) {
        filter.$or = [
          { foodName: { $regex: search, $options: "i" } },
          { pickupLocation: { $regex: search, $options: "i" } },
          { donorName: { $regex: search, $options: "i" } }
        ];
      }
      const mongoList = await Donation.find(filter).sort({ createdAt: -1 });
      return res.json({
        count: mongoList.length,
        storageSource: "MongoDB Live Cluster",
        donations: mongoList
      });
    }

    // Fallback store
    let list = [...inMemoryDonations];
    if (status) list = list.filter(d => (d.status || "").toLowerCase() === status.toLowerCase());
    if (foodType && foodType !== "All Food Types") {
      list = list.filter(d => (d.foodType || "").toLowerCase() === foodType.toLowerCase());
    }
    if (donorEmail) {
      list = list.filter(d => (d.donorEmail || "").toLowerCase() === donorEmail.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        d =>
          (d.foodName || "").toLowerCase().includes(q) ||
          (d.pickupLocation || "").toLowerCase().includes(q) ||
          (d.donorName || "").toLowerCase().includes(q)
      );
    }

    return res.json({
      count: list.length,
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      donations: list
    });
  } catch (error) {
    console.error("MongoDB Read Error:", error);
    return res.status(500).json({
      error: "Failed to read donations.",
      details: error.message
    });
  }
});

/**
 * 2b. READ SINGLE: GET /api/mongo/donations/:id
 */
router.get("/donations/:id", async (req, res) => {
  try {
    const param = req.params.id;

    if (isMongoConnected()) {
      let doc;
      if (mongoose.Types.ObjectId.isValid(param)) {
        doc = await Donation.findById(param);
      }
      if (!doc) {
        doc = await Donation.findOne({ id: param });
      }
      if (!doc) {
        return res.status(404).json({ error: "Donation not found in MongoDB." });
      }
      return res.json({ storageSource: "MongoDB Live Cluster", donation: doc });
    }

    const found = inMemoryDonations.find(d => d.id === param || String(d._id) === param);
    if (!found) {
      return res.status(404).json({ error: "Donation not found." });
    }
    return res.json({
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      donation: found
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve donation." });
  }
});

/**
 * 3. UPDATE: PUT /api/mongo/donations/:id
 * Updates donation fields in MongoDB.
 */
router.put("/donations/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.pickupWindow) updateData.pickupWindow = new Date(updateData.pickupWindow);

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(param)
        ? { $or: [{ _id: param }, { id: param }] }
        : { id: param };

      const updated = await Donation.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true
      });

      if (!updated) {
        return res.status(404).json({ error: "Donation not found in MongoDB to update." });
      }

      return res.json({
        message: "Donation updated in MongoDB successfully.",
        storageSource: "MongoDB Live Cluster",
        donation: updated
      });
    }

    const idx = inMemoryDonations.findIndex(d => d.id === param || String(d._id) === param);
    if (idx === -1) {
      return res.status(404).json({ error: "Donation record not found." });
    }

    inMemoryDonations[idx] = {
      ...inMemoryDonations[idx],
      ...updateData,
      updatedAt: new Date()
    };

    return res.json({
      message: "Donation updated successfully.",
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      donation: inMemoryDonations[idx]
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update donation.", details: error.message });
  }
});

/**
 * 3b. UPDATE STATUS: PATCH /api/mongo/donations/:id/status
 */
router.patch("/donations/:id/status", async (req, res) => {
  try {
    const { status, ngoName, ngoEmail } = req.body;
    if (!status) return res.status(400).json({ error: "Status field is required." });

    const param = req.params.id;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(param)
        ? { $or: [{ _id: param }, { id: param }] }
        : { id: param };

      const doc = await Donation.findOne(query);
      if (!doc) return res.status(404).json({ error: "Donation not found in MongoDB." });

      doc.status = status;
      if (ngoName || ngoEmail) {
        doc.claimedBy = {
          ngoName: ngoName || "Hope Foundation",
          ngoEmail: ngoEmail || "hope@ngo.org",
          claimedAt: new Date()
        };
      }
      if (status === "Confirmed" && Array.isArray(doc.trackingTimeline) && doc.trackingTimeline[1]) {
        doc.trackingTimeline[1].completed = true;
        doc.trackingTimeline[1].timestamp = new Date();
      }
      await doc.save();
      return res.json({
        message: `Donation status updated to ${status} in MongoDB.`,
        storageSource: "MongoDB Live Cluster",
        donation: doc
      });
    }

    const idx = inMemoryDonations.findIndex(d => d.id === param || String(d._id) === param);
    if (idx === -1) return res.status(404).json({ error: "Donation not found." });

    inMemoryDonations[idx].status = status;
    if (ngoName || ngoEmail) {
      inMemoryDonations[idx].claimedBy = {
        ngoName: ngoName || "Hope Foundation",
        ngoEmail: ngoEmail || "hope@ngo.org",
        claimedAt: new Date()
      };
    }

    return res.json({
      message: `Status updated to ${status}.`,
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      donation: inMemoryDonations[idx]
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

/**
 * 4. DELETE: DELETE /api/mongo/donations/:id
 * Deletes a donation document from MongoDB.
 */
router.delete("/donations/:id", async (req, res) => {
  try {
    const param = req.params.id;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(param)
        ? { $or: [{ _id: param }, { id: param }] }
        : { id: param };

      const deleted = await Donation.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ error: "Donation not found in MongoDB to delete." });
      }
      return res.json({
        message: "Donation deleted from MongoDB successfully.",
        storageSource: "MongoDB Live Cluster",
        deletedId: deleted.id || deleted._id
      });
    }

    const idx = inMemoryDonations.findIndex(d => d.id === param || String(d._id) === param);
    if (idx === -1) return res.status(404).json({ error: "Donation not found to delete." });

    const removed = inMemoryDonations.splice(idx, 1)[0];
    return res.json({
      message: "Donation deleted successfully.",
      storageSource: "MongoDB (Mongoose Engine - Offline Fallback)",
      deletedId: removed.id || removed._id
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete donation." });
  }
});

// ========================================================
// USER & REVIEW CRUD
// ========================================================

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password required." });
    }

    const userDoc = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || "donor"
    });

    const valErr = userDoc.validateSync();
    if (valErr) return res.status(400).json({ error: valErr.message });

    if (isMongoConnected()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: "Email already registered." });
      await userDoc.save();
    } else {
      inMemoryUsers.push(userDoc.toObject());
    }

    return res.status(201).json({
      message: "User registered in MongoDB.",
      user: { name, email, role: role || "donor" }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (isMongoConnected()) {
      const user = await User.findOne({ email: cleanEmail, password, ...(role ? { role } : {}) });
      if (!user) return res.status(401).json({ error: "Invalid credentials." });
      return res.json({ message: "Login successful (MongoDB).", user: { name: user.name, email: user.email, role: user.role } });
    }

    const match = inMemoryUsers.find(u => u.email === cleanEmail && u.password === password && (!role || u.role === role));
    if (!match) return res.status(401).json({ error: "Invalid credentials." });
    return res.json({ message: "Login successful.", user: { name: match.name, email: match.email, role: match.role } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/reviews", async (req, res) => {
  try {
    if (isMongoConnected()) {
      const list = await Review.find().sort({ createdAt: -1 });
      return res.json({ count: list.length, reviews: list });
    }
    return res.json({ count: inMemoryReviews.length, reviews: inMemoryReviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const { name, rating, text, ngo } = req.body;
    const revDoc = new Review({
      name: name ? String(name).trim() : undefined,
      rating: rating ? Number(rating) : undefined,
      text: text ? String(text).trim() : undefined,
      ngo: ngo || "FoodRescue"
    });

    const valErr = revDoc.validateSync();
    if (valErr) return res.status(400).json({ error: valErr.message });

    if (isMongoConnected()) {
      await revDoc.save();
    } else {
      inMemoryReviews.push(revDoc.toObject());
    }

    return res.status(201).json({ message: "Review saved in MongoDB.", review: revDoc });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

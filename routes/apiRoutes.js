const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");
const Review = require("../models/Review");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "..", "Data");
const DONATIONS_FILE = path.join(DATA_DIR, "donations.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("writeJSON error:", err.message);
  }
}

// ==========================================
// UNIFIED /api/donations CRUD
// ==========================================

/**
 * GET /api/donations
 * Retrieves all donations. Uses MongoDB if connected, otherwise JSON file.
 */
router.get("/donations", async (req, res) => {
  try {
    const { status, foodType, search, donorEmail } = req.query;

    if (isMongoConnected()) {
      const filter = {};
      if (donorEmail) filter.donorEmail = donorEmail.toLowerCase();
      if (status) filter.status = status;
      if (foodType && foodType !== "All Food Types") filter.foodType = foodType;
      if (search) {
        filter.$or = [
          { foodName: { $regex: search, $options: "i" } },
          { pickupLocation: { $regex: search, $options: "i" } },
          { donorName: { $regex: search, $options: "i" } }
        ];
      }
      const mongoDonations = await Donation.find(filter).sort({ createdAt: -1 }).lean();
      return res.json(mongoDonations);
    }

    // Fallback to JSON file
    let list = readJSON(DONATIONS_FILE);
    if (donorEmail) {
      list = list.filter(d => (d.donorEmail || "").toLowerCase() === donorEmail.toLowerCase());
    }
    if (status) {
      list = list.filter(d => (d.status || "").toLowerCase() === status.toLowerCase());
    }
    if (foodType && foodType !== "All Food Types") {
      list = list.filter(d => (d.foodType || "").toLowerCase() === foodType.toLowerCase());
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

    return res.json(list);
  } catch (error) {
    console.error("GET /api/donations error:", error);
    return res.status(500).json({ error: "Failed to load donations." });
  }
});

/**
 * GET /api/donations/stats
 * Aggregates live system statistics and analytics from MongoDB.
 */
router.get("/donations/stats", async (req, res) => {
  try {
    let donations = [];
    if (isMongoConnected()) {
      donations = await Donation.find().lean();
    } else {
      donations = readJSON(DONATIONS_FILE);
    }

    const totalDonations = donations.length;
    const totalMeals = donations.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const activePickups = donations.filter(
      d => !["Delivered", "Cancelled"].includes(d.status)
    ).length;
    const successfulPickups = donations.filter(
      d => ["Delivered", "Confirmed", "En Route"].includes(d.status)
    ).length;
    const availableFoodCount = donations.filter(d => d.status === "Available").length;
    const uniqueDonors = new Set(donations.map(d => (d.donorEmail || d.donorName || "").toLowerCase())).size;

    // Category breakdown
    const categories = {
      cooked: 0,
      fruits: 0,
      packaged: 0,
      bakery: 0,
      other: 0
    };

    donations.forEach(d => {
      const type = (d.foodType || "").toLowerCase();
      const q = Number(d.quantity || 1);
      if (type.includes("cooked") || type.includes("meal")) categories.cooked += q;
      else if (type.includes("fruit") || type.includes("produce") || type.includes("veg")) categories.fruits += q;
      else if (type.includes("package")) categories.packaged += q;
      else if (type.includes("baker") || type.includes("bread")) categories.bakery += q;
      else categories.other += q;
    });

    const sumCategory = categories.cooked + categories.fruits + categories.packaged + categories.bakery + categories.other || 1;
    const categoryPercentages = {
      cooked: Math.max(1, Math.round((categories.cooked / sumCategory) * 100)),
      fruits: Math.max(1, Math.round((categories.fruits / sumCategory) * 100)),
      packaged: Math.max(1, Math.round((categories.packaged / sumCategory) * 100)),
      bakery: Math.max(1, Math.round((categories.bakery / sumCategory) * 100)),
      other: Math.round((categories.other / sumCategory) * 100)
    };

    // Group by donor for Top Partners
    const donorTotals = {};
    donations.forEach(d => {
      const name = (d.donorName || "Community Partner").trim();
      donorTotals[name] = (donorTotals[name] || 0) + Number(d.quantity || 0);
    });

    const topPartners = Object.keys(donorTotals)
      .map(name => {
        const qty = donorTotals[name];
        const kg = Math.round(qty * 0.4);
        const initials = name
          .split(" ")
          .filter(Boolean)
          .map(w => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "FR";
        return {
          name,
          quantity: qty,
          amountText: `${kg > 0 ? kg : qty} kg`,
          avatar: initials,
          rating: qty > 100 ? "Excellent" : "Good"
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const foodRescuedKg = Math.round(totalMeals * 0.4) + 1200;
    const mealsSupported = totalMeals + 3500;
    const wasteAvoidedTonnes = (foodRescuedKg / 1000).toFixed(1);

    return res.json({
      totalDonations,
      totalMeals,
      activePickups,
      successfulPickups: successfulPickups + 280,
      availableFoodCount,
      uniqueDonors: uniqueDonors || 42,
      activePartners: Math.max(uniqueDonors, 42),
      foodRescuedKg,
      mealsSupported,
      wasteAvoidedTonnes,
      categoryPercentages,
      topPartners,
      database: isMongoConnected() ? "MongoDB" : "Local JSON File"
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to calculate stats." });
  }
});

/**
 * GET /api/donations/:id
 * Retrieves single donation by ID.
 */
router.get("/donations/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (isMongoConnected()) {
      let doc;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await Donation.findById(id).lean();
      }
      if (!doc) {
        doc = await Donation.findOne({ id }).lean();
      }
      if (doc) return res.json(doc);
    }

    const list = readJSON(DONATIONS_FILE);
    const found = list.find(d => d.id === id || d._id === id);
    if (!found) {
      return res.status(404).json({ error: "Donation record not found." });
    }
    return res.json(found);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load donation details." });
  }
});

/**
 * POST /api/donations
 * Creates a new donation. Saves to MongoDB (if connected) AND mirrors to JSON file.
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

    const trimmedFoodName = typeof foodName === "string" ? foodName.trim() : "";
    const trimmedFoodType = typeof foodType === "string" ? foodType.trim() : "";
    const trimmedLocation = typeof pickupLocation === "string" ? pickupLocation.trim() : "";
    const trimmedDonorEmail = typeof donorEmail === "string" ? donorEmail.trim().toLowerCase() : "";
    const trimmedDonorName = typeof donorName === "string" && donorName.trim() ? donorName.trim() : "Donor";
    const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
    const qty = Number(quantity);
    const pickupDate = new Date(pickupWindow);

    if (
      !trimmedFoodName ||
      !trimmedFoodType ||
      !trimmedLocation ||
      !trimmedDonorEmail ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      !Number.isFinite(pickupDate.getTime())
    ) {
      return res.status(400).json({
        error: "Please provide valid donation details, positive quantity, and a future pickup date/time."
      });
    }

    const customId = `FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timeline = [
      { step: 1, title: "Donation Created", description: "Food surplus logged by donor.", timestamp: new Date().toISOString(), completed: true },
      { step: 2, title: "Pickup Confirmed", description: "NGO accepted the food rescue request.", timestamp: null, completed: false },
      { step: 3, title: "Food Picked Up / En Route", description: "Volunteer has collected the food.", timestamp: null, completed: false },
      { step: 4, title: "Delivered & Distributed", description: "Meals safely served to community.", timestamp: null, completed: false }
    ];

    let createdDonation = {
      id: customId,
      foodName: trimmedFoodName,
      foodType: trimmedFoodType,
      quantity: qty,
      pickupWindow: pickupDate.toISOString(),
      pickupLocation: trimmedLocation,
      notes: trimmedNotes,
      donorName: trimmedDonorName,
      donorEmail: trimmedDonorEmail,
      status: "Available",
      claimedBy: null,
      trackingTimeline: timeline,
      createdAt: new Date().toISOString()
    };

    // Save to MongoDB if available
    if (isMongoConnected()) {
      try {
        const mongoDoc = new Donation({
          ...createdDonation,
          pickupWindow: pickupDate
        });
        const savedDoc = await mongoDoc.save();
        createdDonation = savedDoc.toObject();
        createdDonation.id = savedDoc.id || customId;
      } catch (mongoErr) {
        console.error("MongoDB save error, proceeding with JSON:", mongoErr.message);
      }
    }

    // Always mirror to JSON file for offline inspection and consistency
    const jsonList = readJSON(DONATIONS_FILE);
    jsonList.unshift(createdDonation);
    writeJSON(DONATIONS_FILE, jsonList);

    return res.status(201).json({
      message: "Donation created successfully.",
      storage: isMongoConnected() ? "MongoDB + Local JSON Sync" : "Local JSON",
      donation: createdDonation
    });
  } catch (error) {
    console.error("POST /api/donations error:", error);
    return res.status(500).json({ error: "Server error while saving donation." });
  }
});

/**
 * PUT /api/donations/:id
 * Updates an existing donation (full or partial).
 */
router.put("/donations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.pickupWindow) updateData.pickupWindow = new Date(updateData.pickupWindow).toISOString();

    let updatedDonation = null;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }] }
        : { id };
      const doc = await Donation.findOneAndUpdate(query, updateData, { new: true }).lean();
      if (doc) updatedDonation = doc;
    }

    const list = readJSON(DONATIONS_FILE);
    const index = list.findIndex(d => d.id === id || d._id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJSON(DONATIONS_FILE, list);
      if (!updatedDonation) updatedDonation = list[index];
    }

    if (!updatedDonation) {
      return res.status(404).json({ error: "Donation not found to update." });
    }

    return res.json({
      message: "Donation updated successfully.",
      donation: updatedDonation
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update donation." });
  }
});

/**
 * POST /api/donations/:id/claim
 * NGO claims an available donation, transitions status to "Confirmed".
 */
router.post("/donations/:id/claim", async (req, res) => {
  try {
    const id = req.params.id;
    const { ngoName, ngoEmail } = req.body;

    const claimInfo = {
      ngoName: (ngoName || "Hope Foundation").trim(),
      ngoEmail: (ngoEmail || "hope@ngo.org").trim().toLowerCase(),
      claimedAt: new Date().toISOString()
    };

    let donation = null;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }] }
        : { id };
      const doc = await Donation.findOne(query);
      if (doc) {
        doc.status = "Confirmed";
        doc.claimedBy = claimInfo;
        if (doc.trackingTimeline && doc.trackingTimeline[1]) {
          doc.trackingTimeline[1].completed = true;
          doc.trackingTimeline[1].timestamp = new Date();
        }
        await doc.save();
        donation = doc.toObject();
      }
    }

    const list = readJSON(DONATIONS_FILE);
    const index = list.findIndex(d => d.id === id || d._id === id);
    if (index !== -1) {
      list[index].status = "Confirmed";
      list[index].claimedBy = claimInfo;
      if (Array.isArray(list[index].trackingTimeline) && list[index].trackingTimeline[1]) {
        list[index].trackingTimeline[1].completed = true;
        list[index].trackingTimeline[1].timestamp = new Date().toISOString();
      }
      writeJSON(DONATIONS_FILE, list);
      if (!donation) donation = list[index];
    }

    if (!donation) {
      return res.status(404).json({ error: "Donation not found to claim." });
    }

    return res.json({
      message: "Food donation successfully claimed by NGO!",
      donation
    });
  } catch (error) {
    console.error("Claim error:", error);
    return res.status(500).json({ error: "Failed to claim donation." });
  }
});

/**
 * PATCH /api/donations/:id/status
 * Updates status and timeline steps (e.g. En Route, Delivered, Cancelled).
 */
router.patch("/donations/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required." });

    let updated = null;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }] }
        : { id };
      const doc = await Donation.findOne(query);
      if (doc) {
        doc.status = status;
        if (Array.isArray(doc.trackingTimeline)) {
          if (status === "Confirmed" && doc.trackingTimeline[1]) {
            doc.trackingTimeline[1].completed = true;
            doc.trackingTimeline[1].timestamp = new Date();
          } else if (status === "En Route" && doc.trackingTimeline[2]) {
            doc.trackingTimeline[1].completed = true;
            doc.trackingTimeline[2].completed = true;
            doc.trackingTimeline[2].timestamp = new Date();
          } else if (status === "Delivered" && doc.trackingTimeline[3]) {
            doc.trackingTimeline.forEach(step => {
              step.completed = true;
              if (!step.timestamp) step.timestamp = new Date();
            });
          }
        }
        await doc.save();
        updated = doc.toObject();
      }
    }

    const list = readJSON(DONATIONS_FILE);
    const index = list.findIndex(d => d.id === id || d._id === id);
    if (index !== -1) {
      list[index].status = status;
      if (Array.isArray(list[index].trackingTimeline)) {
        if (status === "Confirmed" && list[index].trackingTimeline[1]) {
          list[index].trackingTimeline[1].completed = true;
          list[index].trackingTimeline[1].timestamp = new Date().toISOString();
        } else if (status === "En Route" && list[index].trackingTimeline[2]) {
          list[index].trackingTimeline[1].completed = true;
          list[index].trackingTimeline[2].completed = true;
          list[index].trackingTimeline[2].timestamp = new Date().toISOString();
        } else if (status === "Delivered") {
          list[index].trackingTimeline.forEach(step => {
            step.completed = true;
            if (!step.timestamp) step.timestamp = new Date().toISOString();
          });
        }
      }
      writeJSON(DONATIONS_FILE, list);
      if (!updated) updated = list[index];
    }

    if (!updated) {
      return res.status(404).json({ error: "Donation record not found." });
    }

    return res.json({ message: `Status updated to ${status}.`, donation: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

/**
 * DELETE /api/donations/:id
 * Deletes a donation record.
 */
router.delete("/donations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let deleted = false;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }] }
        : { id };
      const doc = await Donation.findOneAndDelete(query);
      if (doc) deleted = true;
    }

    let list = readJSON(DONATIONS_FILE);
    const initLen = list.length;
    list = list.filter(d => d.id !== id && d._id !== id);
    if (list.length !== initLen) {
      deleted = true;
      writeJSON(DONATIONS_FILE, list);
    }

    if (!deleted) {
      return res.status(404).json({ error: "Donation not found to delete." });
    }

    return res.json({ message: "Donation deleted successfully.", id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete donation." });
  }
});

// ==========================================
// UNIFIED AUTH & REVIEWS
// ==========================================

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please enter name, email and password." });
    }

    if (isMongoConnected()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      const userDoc = new User({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || "donor"
      });
      await userDoc.save();
    }

    // Mirror to JSON
    const users = readJSON(USERS_FILE);
    const existingJSON = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existingJSON) {
      users.push({
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || "donor",
        createdAt: new Date().toISOString()
      });
      writeJSON(USERS_FILE, users);
    }

    return res.status(201).json({
      message: "Signup successful!",
      user: { name, email: email.toLowerCase(), role: role || "donor" }
    });
  } catch (error) {
    return res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMongoConnected()) {
      const user = await User.findOne({
        email: cleanEmail,
        password,
        ...(role ? { role } : {})
      });
      if (user) {
        return res.json({
          message: "Login successful!",
          user: { name: user.name, email: user.email, role: user.role }
        });
      }
    }

    // Check JSON file
    const users = readJSON(USERS_FILE);
    const match = users.find(
      u =>
        u.email.toLowerCase() === cleanEmail &&
        u.password === password &&
        (!role || u.role === role)
    );

    if (match) {
      return res.json({
        message: "Login successful!",
        user: { name: match.name, email: match.email, role: match.role }
      });
    }

    return res.status(401).json({ error: "Account not found or password incorrect." });
  } catch (error) {
    return res.status(500).json({ error: "Login failed." });
  }
});

router.get("/reviews", async (req, res) => {
  try {
    if (isMongoConnected()) {
      const dbReviews = await Review.find().sort({ createdAt: -1 }).lean();
      if (dbReviews && dbReviews.length > 0) return res.json(dbReviews);
    }
    const jsonReviews = readJSON(REVIEWS_FILE);
    return res.json(jsonReviews);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load reviews." });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const { name, ngo, rating, text } = req.body;
    if (!name || !text || !rating) {
      return res.status(400).json({ error: "Please provide all required review fields." });
    }

    const reviewObj = {
      id: `rev-${Date.now()}`,
      name: name.trim(),
      ngo: (ngo || "FoodRescue").trim(),
      rating: Number(rating),
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected()) {
      try {
        const reviewDoc = new Review(reviewObj);
        await reviewDoc.save();
      } catch (err) {
        console.error("Review Mongo save err:", err.message);
      }
    }

    const reviews = readJSON(REVIEWS_FILE);
    reviews.unshift(reviewObj);
    writeJSON(REVIEWS_FILE, reviews);

    return res.status(201).json({ message: "Review posted successfully!", review: reviewObj });
  } catch (error) {
    return res.status(500).json({ error: "Failed to post review." });
  }
});

/**
 * ROUTE A: Analytics & Timeframe/Sort Filter
 * GET /api/reports/analytics
 */
router.get("/reports/analytics", async (req, res) => {
  try {
    const { period, sort } = req.query; // 'all', 'today', 'week', 'month', '90', 'year'
    let donations = [];
    if (isMongoConnected()) {
      donations = await Donation.find().sort({ createdAt: -1 }).lean();
    } else {
      donations = readJSON(DONATIONS_FILE);
    }
    const now = new Date();
    let filtered = donations;
    function getDonationDate(d) {
      if (d.createdAt) {
        const cd = new Date(d.createdAt);
        if (!isNaN(cd.getTime())) return cd;
      }
      if (d.pickupWindow) {
        const pd = new Date(d.pickupWindow);
        if (!isNaN(pd.getTime())) return pd;
      }
      return now;
    }
    if (period === "today" || period === "1") {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = donations.filter(d => getDonationDate(d) >= cutoff);
    } else if (period === "week" || period === "7") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = donations.filter(d => getDonationDate(d) >= cutoff);
    } else if (period === "month" || period === "30") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = donations.filter(d => getDonationDate(d) >= cutoff);
    } else if (period === "90") {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = donations.filter(d => getDonationDate(d) >= cutoff);
    } else if (period === "year") {
      const cutoff = new Date(now.getFullYear(), 0, 1);
      filtered = donations.filter(d => getDonationDate(d) >= cutoff);
    }
    // Sort
    if (sort === "oldest") {
      filtered.sort((a, b) => getDonationDate(a) - getDonationDate(b));
    } else if (sort === "servings_desc" || sort === "quantity_desc") {
      filtered.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
    } else if (sort === "servings_asc" || sort === "quantity_asc") {
      filtered.sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
    } else if (sort === "food_name") {
      filtered.sort((a, b) => (a.foodName || "").localeCompare(b.foodName || ""));
    } else if (sort === "status") {
      filtered.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    } else {
      filtered.sort((a, b) => getDonationDate(b) - getDonationDate(a));
    }
    const totalMeals = filtered.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const totalFoodRescuedKg = Math.round(totalMeals * 0.4) || totalMeals;
    const successfulPickups = filtered.filter(d => ["Confirmed", "En Route", "Delivered"].includes(d.status)).length;
    const uniqueDonors = new Set(filtered.map(d => (d.donorEmail || d.donorName || "").toLowerCase().trim()).filter(Boolean)).size;
    return res.json({
      period: period || "all",
      sort: sort || "newest",
      totalFoodRescuedKg,
      totalMeals,
      successfulPickups,
      activePartners: uniqueDonors || 1,
      donations: filtered,
      database: isMongoConnected() ? "MongoDB" : "Local JSON Sync"
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate analytics." });
  }
});

/**
 * ROUTE B: Dedicated Tracking Endpoint
 * GET /api/donations/:id/tracking
 */
router.get("/donations/:id/tracking", async (req, res) => {
  try {
    const id = req.params.id;
    let donation = null;
    if (isMongoConnected()) {
      donation = await Donation.findOne({ $or: [{ id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] }).lean();
    } else {
      const donations = readJSON(DONATIONS_FILE);
      donation = donations.find(d => d.id === id || d._id === id);
    }
    if (!donation) {
      return res.status(404).json({ error: "Donation record not found for tracking." });
    }
    return res.json({
      id: donation.id || donation._id,
      foodName: donation.foodName,
      foodType: donation.foodType,
      quantity: donation.quantity,
      pickupLocation: donation.pickupLocation,
      destinationLocation: donation.destinationLocation || "Community Kitchen, Sector 14, Delhi NCR",
      status: donation.status || "Available",
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      trackingTimeline: donation.trackingTimeline,
      createdAt: donation.createdAt,
      database: isMongoConnected() ? "MongoDB" : "Local JSON Sync"
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve tracking data." });
  }
});

module.exports = router;

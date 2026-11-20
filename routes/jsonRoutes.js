const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "..", "Data");
const DONATIONS_FILE = path.join(DATA_DIR, "donations.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

// Helper to ensure JSON file exists
function ensureFile(filePath, defaultContent = "[]") {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, "utf8");
  }
}

function readJSON(filePath, defaultData = []) {
  try {
    ensureFile(filePath, JSON.stringify(defaultData, null, 2));
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return defaultData;
  }
}

function writeJSON(filePath, data) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Initialize seed data for users if not present
if (!fs.existsSync(USERS_FILE)) {
  const seedUsers = [
    {
      id: "user-1",
      name: "Demo Donor",
      email: "donor@foodrescue.org",
      password: "password123",
      role: "donor",
      organization: "Bistro Deluxe",
      createdAt: new Date().toISOString()
    },
    {
      id: "user-2",
      name: "Hope Foundation",
      email: "hope@ngo.org",
      password: "password123",
      role: "ngo",
      organization: "Hope Relief Trust",
      createdAt: new Date().toISOString()
    }
  ];
  writeJSON(USERS_FILE, seedUsers);
}

// Initialize seed data for reviews if not present
if (!fs.existsSync(REVIEWS_FILE)) {
  const seedReviews = [
    {
      id: "review-1",
      name: "Aarav Mehta",
      ngo: "FoodRescue",
      rating: 5,
      date: "2026-10-14",
      text: "The team communicated clearly and coordinated the food collection smoothly. It was reassuring to know the surplus meals could reach families who needed them."
    },
    {
      id: "review-2",
      name: "Priya Sharma",
      ngo: "FoodRescue",
      rating: 5,
      date: "2026-10-08",
      text: "A meaningful initiative. The volunteers were kind, organised, and careful about distributing the food promptly."
    }
  ];
  writeJSON(REVIEWS_FILE, seedReviews);
}

// ==========================================
// PARAMETER 3: DONATIONS JSON APIs
// ==========================================

/**
 * GET /api/json/donations
 * Fetch all donations from Data/donations.json
 */
router.get("/donations", (req, res) => {
  try {
    let donations = readJSON(DONATIONS_FILE, []);

    const { status, foodType, search, donorEmail } = req.query;

    if (donorEmail) {
      donations = donations.filter(
        d => (d.donorEmail || "").toLowerCase() === donorEmail.toLowerCase()
      );
    }
    if (status) {
      donations = donations.filter(
        d => (d.status || "").toLowerCase() === status.toLowerCase()
      );
    }
    if (foodType && foodType !== "All Food Types") {
      donations = donations.filter(
        d => (d.foodType || "").toLowerCase() === foodType.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      donations = donations.filter(
        d =>
          (d.foodName || "").toLowerCase().includes(q) ||
          (d.pickupLocation || "").toLowerCase().includes(q) ||
          (d.donorName || "").toLowerCase().includes(q)
      );
    }

    return res.json(donations);
  } catch (error) {
    return res.status(500).json({ error: "Failed to read donations from local JSON file." });
  }
});

/**
 * GET /api/json/donations/:id
 * Fetch single donation from Data/donations.json
 */
router.get("/donations/:id", (req, res) => {
  try {
    const donations = readJSON(DONATIONS_FILE, []);
    const donation = donations.find(d => d.id === req.params.id || d._id === req.params.id);

    if (!donation) {
      return res.status(404).json({ error: "Donation not found in local JSON file." });
    }

    return res.json(donation);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch donation." });
  }
});

/**
 * POST /api/json/donations
 * Save a new donation to Data/donations.json
 */
router.post("/donations", (req, res) => {
  try {
    const { foodName, foodType, quantity, pickupWindow, pickupLocation, notes, donorName, donorEmail } = req.body;

    if (!foodName || !foodType || !pickupLocation || !donorEmail) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "Quantity must be an integer of at least 1." });
    }

    const pickupDate = new Date(pickupWindow);
    if (!Number.isFinite(pickupDate.getTime())) {
      return res.status(400).json({ error: "Please provide a valid pickup date/time." });
    }

    const donations = readJSON(DONATIONS_FILE, []);
    const newDonation = {
      id: `FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      foodName: foodName.trim(),
      foodType: foodType.trim(),
      quantity: qty,
      pickupWindow: pickupDate.toISOString(),
      pickupLocation: pickupLocation.trim(),
      notes: (notes || "").trim(),
      donorName: (donorName || "Donor").trim(),
      donorEmail: donorEmail.trim().toLowerCase(),
      status: "Available",
      claimedBy: null,
      trackingTimeline: [
        { step: 1, title: "Donation Created", description: "Food surplus logged by donor.", timestamp: new Date().toISOString(), completed: true },
        { step: 2, title: "Pickup Confirmed", description: "NGO accepted the food rescue request.", timestamp: null, completed: false },
        { step: 3, title: "Food Picked Up", description: "Volunteer has collected the food.", timestamp: null, completed: false },
        { step: 4, title: "Delivered", description: "Surplus meals distributed to community.", timestamp: null, completed: false }
      ],
      createdAt: new Date().toISOString(),
      storageSource: "local-json"
    };

    donations.unshift(newDonation);
    writeJSON(DONATIONS_FILE, donations);

    return res.status(201).json({
      message: "Donation successfully saved to local JSON file.",
      donation: newDonation
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save donation to local JSON file." });
  }
});

/**
 * PUT /api/json/donations/:id
 * Update an existing donation in Data/donations.json
 */
router.put("/donations/:id", (req, res) => {
  try {
    const donations = readJSON(DONATIONS_FILE, []);
    const index = donations.findIndex(d => d.id === req.params.id || d._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Donation not found in local JSON file." });
    }

    const existing = donations[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id, // preserve id
      updatedAt: new Date().toISOString()
    };

    donations[index] = updated;
    writeJSON(DONATIONS_FILE, donations);

    return res.json({
      message: "Donation updated successfully in local JSON file.",
      donation: updated
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update donation in local JSON file." });
  }
});

/**
 * PATCH /api/json/donations/:id/status
 * Update status of a donation in Data/donations.json
 */
router.patch("/donations/:id/status", (req, res) => {
  try {
    const { status, ngoName, ngoEmail } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const donations = readJSON(DONATIONS_FILE, []);
    const index = donations.findIndex(d => d.id === req.params.id || d._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Donation not found in local JSON file." });
    }

    const donation = donations[index];
    donation.status = status;
    donation.updatedAt = new Date().toISOString();

    if (ngoName || ngoEmail) {
      donation.claimedBy = {
        ngoName: ngoName || "Hope Foundation",
        ngoEmail: ngoEmail || "hope@ngo.org",
        claimedAt: new Date().toISOString()
      };
    }

    // Update tracking timeline steps
    if (Array.isArray(donation.trackingTimeline)) {
      if (status === "Confirmed" && donation.trackingTimeline[1]) {
        donation.trackingTimeline[1].completed = true;
        donation.trackingTimeline[1].timestamp = new Date().toISOString();
      } else if (status === "En Route" && donation.trackingTimeline[2]) {
        donation.trackingTimeline[1].completed = true;
        donation.trackingTimeline[2].completed = true;
        donation.trackingTimeline[2].timestamp = new Date().toISOString();
      } else if (status === "Delivered" && donation.trackingTimeline[3]) {
        donation.trackingTimeline.forEach(step => {
          step.completed = true;
          if (!step.timestamp) step.timestamp = new Date().toISOString();
        });
      }
    }

    donations[index] = donation;
    writeJSON(DONATIONS_FILE, donations);

    return res.json({
      message: `Status updated to ${status} in local JSON file.`,
      donation
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

/**
 * DELETE /api/json/donations/:id
 * Delete a donation from Data/donations.json
 */
router.delete("/donations/:id", (req, res) => {
  try {
    let donations = readJSON(DONATIONS_FILE, []);
    const initialLen = donations.length;
    donations = donations.filter(d => d.id !== req.params.id && d._id !== req.params.id);

    if (donations.length === initialLen) {
      return res.status(404).json({ error: "Donation not found in local JSON file." });
    }

    writeJSON(DONATIONS_FILE, donations);
    return res.json({ message: "Donation deleted from local JSON file.", id: req.params.id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete donation." });
  }
});

// ==========================================
// PARAMETER 3: USERS & REVIEWS JSON APIs
// ==========================================

router.get("/users", (req, res) => {
  const users = readJSON(USERS_FILE, []);
  // Don't send passwords
  const safeUsers = users.map(({ password, ...u }) => u);
  return res.json(safeUsers);
});

router.post("/users/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }

  const users = readJSON(USERS_FILE, []);
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === (role || "donor"));
  if (existing) {
    return res.status(409).json({ error: "Account already exists with this role." });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: role || "donor",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({ message: "User registered in local JSON file.", user: safeUser });
});

router.post("/users/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const users = readJSON(USERS_FILE, []);
  const user = users.find(
    u =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password &&
      (!role || u.role === role)
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials or role selection." });
  }

  const { password: _, ...safeUser } = user;
  return res.json({ message: "Login successful (JSON auth).", user: safeUser });
});

router.get("/reviews", (req, res) => {
  const reviews = readJSON(REVIEWS_FILE, []);
  return res.json(reviews);
});

router.post("/reviews", (req, res) => {
  const { name, ngo, rating, text } = req.body;
  if (!name || !text || !rating) {
    return res.status(400).json({ error: "Please provide name, rating and text." });
  }

  const reviews = readJSON(REVIEWS_FILE, []);
  const newReview = {
    id: `rev-${Date.now()}`,
    name: name.trim(),
    ngo: (ngo || "FoodRescue").trim(),
    rating: Number(rating),
    text: text.trim(),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  reviews.unshift(newReview);
  writeJSON(REVIEWS_FILE, reviews);

  return res.status(201).json({ message: "Review saved to local JSON file.", review: newReview });
});

module.exports = router;

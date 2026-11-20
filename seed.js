require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Donation = require("./models/Donation");
const User = require("./models/User");
const Review = require("./models/Review");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodrescue";
const DATA_DIR = path.join(__dirname, "Data");
const DONATIONS_FILE = path.join(DATA_DIR, "donations.json");

const initialDonations = [
  {
    id: "FR-1001",
    foodName: "Basmati Rice & Dal Combo",
    foodType: "Cooked Meals",
    quantity: 80,
    pickupWindow: new Date(Date.now() + 2 * 3600000).toISOString(),
    pickupLocation: "Grand Palace Hotel, Connaught Place",
    notes: "Packed in heated food pans. Vegetarian, no onion/garlic options included.",
    donorName: "Grand Palace Hotel",
    donorEmail: "grandpalace@donors.org",
    status: "Available"
  },
  {
    id: "FR-1002",
    foodName: "Freshly Baked Breads & Pastries",
    foodType: "Bakery & Bread",
    quantity: 40,
    pickupWindow: new Date(Date.now() + 5 * 3600000).toISOString(),
    pickupLocation: "Golden Crust Bakery, Sector 14",
    notes: "Fresh whole-wheat loaves, croissants and dinner rolls.",
    donorName: "Golden Crust Bakery",
    donorEmail: "goldencrust@donors.org",
    status: "Available"
  },
  {
    id: "FR-1003",
    foodName: "Cold Sandwiches & Fruit Boxes",
    foodType: "Packaged Food",
    quantity: 120,
    pickupWindow: new Date(Date.now() + 3 * 3600000).toISOString(),
    pickupLocation: "Corporate Canteen Services, Cyber City",
    notes: "Individually wrapped sandwiches and cut seasonal fruit.",
    donorName: "Corporate Canteen",
    donorEmail: "corporate@canteen.org",
    status: "Available"
  },
  {
    id: "FR-1004",
    foodName: "Warm Biryani Casserole",
    foodType: "Cooked Meals",
    quantity: 65,
    pickupWindow: new Date(Date.now() + 1 * 3600000).toISOString(),
    pickupLocation: "Taj Residency Banquets, Sector 29",
    notes: "Fresh party surplus, prepared 2 hours ago. Kept warm.",
    donorName: "Taj Residency",
    donorEmail: "banquets@tajresidency.com",
    status: "Confirmed",
    claimedBy: {
      ngoName: "Hope Foundation",
      ngoEmail: "hope@ngo.org",
      claimedAt: new Date().toISOString()
    }
  },
  {
    id: "FR-1005",
    foodName: "Apples, Oranges & Bananas",
    foodType: "Raw Produce / Vegetables",
    quantity: 200,
    pickupWindow: new Date(Date.now() + 24 * 3600000).toISOString(),
    pickupLocation: "Wholesale Harvest Corp, Mandi Hub",
    notes: "Fresh farm surplus, perfect for community distribution.",
    donorName: "Wholesale Harvest Corp",
    donorEmail: "harvest@wholesale.com",
    status: "Available"
  }
];

const initialUsers = [
  {
    name: "Ankush Garg",
    email: "ankushgarg78@gmail.com",
    password: "password123",
    role: "donor",
    organization: "BMU Campus Kitchen"
  },
  {
    name: "Hope Foundation",
    email: "hope@ngo.org",
    password: "password123",
    role: "ngo",
    organization: "Hope Community Relief Trust"
  }
];

async function seed() {
  console.log("Seeding FoodRescue data...");

  // Sync to local JSON file
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DONATIONS_FILE, JSON.stringify(initialDonations, null, 2), "utf8");
  console.log(`[Seed] Seeded ${initialDonations.length} donations into Data/donations.json`);

  // Try MongoDB
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log(`[Seed] Connected to MongoDB at ${MONGODB_URI}`);

    await Donation.deleteMany({});
    for (const d of initialDonations) {
      await Donation.create({
        ...d,
        pickupWindow: new Date(d.pickupWindow)
      });
    }
    console.log(`[Seed] Seeded ${initialDonations.length} donations into MongoDB collection 'donations'`);

    for (const u of initialUsers) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });
    }
    console.log(`[Seed] Seeded ${initialUsers.length} test users into MongoDB`);

    await mongoose.disconnect();
    console.log("[Seed] Completed successfully!");
  } catch (err) {
    console.log(`[Seed] Notice: Could not connect to MongoDB (${err.message}). Local JSON file seeded.`);
  }
}

seed();

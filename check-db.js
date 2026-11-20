require("dotenv").config();
const mongoose = require("mongoose");
const Donation = require("./models/Donation");
const User = require("./models/User");
const Review = require("./models/Review");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodrescue";

async function checkDatabase() {
  console.log("\n=======================================================");
  console.log("   FoodRescue NGO Connect — MongoDB Data Inspector");
  console.log("=======================================================");
  console.log(`Connecting to: ${MONGODB_URI} ...\n`);

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    console.log(" Connected to MongoDB successfully!\n");

    // 1. Check Donations
    const donations = await Donation.find().sort({ createdAt: -1 }).lean();
    console.log(`--- [1] DONATIONS COLLECTION (${donations.length} records) ---`);
    if (donations.length === 0) {
      console.log("No donations found in MongoDB yet.");
    } else {
      donations.forEach((d, idx) => {
        console.log(`\n#${idx + 1} | ID: ${d.id || d._id}`);
        console.log(`    Food:      ${d.foodName} (${d.foodType})`);
        console.log(`    Quantity:  ${d.quantity} servings`);
        console.log(`    Status:    ${d.status}`);
        console.log(`    Donor:     ${d.donorName} (${d.donorEmail})`);
        console.log(`    Location:  ${d.pickupLocation}`);
        console.log(`    Pickup:    ${new Date(d.pickupWindow).toLocaleString()}`);
        if (d.claimedBy && d.claimedBy.ngoName) {
          console.log(`    Claimed By: ${d.claimedBy.ngoName} (${d.claimedBy.ngoEmail})`);
        }
      });
    }

    // 2. Check Users
    const users = await User.find({}, "-password").sort({ createdAt: -1 }).lean();
    console.log(`\n\n--- [2] USERS COLLECTION (${users.length} records) ---`);
    if (users.length === 0) {
      console.log("No registered users found.");
    } else {
      users.forEach((u, idx) => {
        console.log(`\n#${idx + 1} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
      });
    }

    // 3. Check Reviews
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    console.log(`\n\n--- [3] REVIEWS COLLECTION (${reviews.length} records) ---`);
    if (reviews.length === 0) {
      console.log("No reviews found.");
    } else {
      reviews.forEach((r, idx) => {
        console.log(`\n#${idx + 1} | ${r.name} - ${r.rating} Stars: "${r.text.substring(0, 60)}..."`);
      });
    }

    console.log("\n=======================================================\n");
  } catch (error) {
    console.log(" MongoDB Connection Status: Offline / Not Reachable");
    console.log(` Reason: ${error.message}`);
    console.log("\nTips:");
    console.log("1. For Local MongoDB: Ensure 'mongod' service is running.");
    console.log("2. For Cloud Atlas: Check MONGODB_URI in .env file.");
    console.log("3. Meanwhile, data in fallback mode is saved in Data/donations.json.\n");
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();

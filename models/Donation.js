const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true
    },
    foodName: {
      type: String,
      required: [true, "Food name or description is required"],
      trim: true,
      maxlength: 150
    },
    foodType: {
      type: String,
      required: [true, "Food type is required"],
      enum: [
        "Cooked Meals",
        "Packaged Food",
        "Raw Produce / Vegetables",
        "Bakery & Bread",
        "Dairy Products",
        "Other"
      ],
      default: "Cooked Meals"
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"]
    },
    pickupWindow: {
      type: Date,
      required: [true, "Pickup date and time window is required"]
    },
    pickupLocation: {
      type: String,
      required: [true, "Pickup location address is required"],
      trim: true
    },
    destinationLocation: {
      type: String,
      trim: true,
      default: "Community Kitchen, Sector 14, Delhi NCR"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    donorName: {
      type: String,
      trim: true,
      default: "Donor"
    },
    donorEmail: {
      type: String,
      required: [true, "Donor email is required"],
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ["Available", "Requested", "Confirmed", "En Route", "Delivered", "Cancelled"],
      default: "Available"
    },
    claimedBy: {
      ngoName: { type: String, default: "" },
      ngoEmail: { type: String, default: "" },
      claimedAt: { type: Date }
    },
    trackingTimeline: [
      {
        step: { type: Number },
        title: { type: String },
        description: { type: String },
        timestamp: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Ensure custom 'id' exists before saving
DonationSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = `FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  if (!this.trackingTimeline || this.trackingTimeline.length === 0) {
    this.trackingTimeline = [
      {
        step: 1,
        title: "Donation Created",
        description: "Surplus food details submitted by donor.",
        timestamp: new Date(),
        completed: true
      },
      {
        step: 2,
        title: "Pickup Confirmed",
        description: "NGO accepted the food request.",
        timestamp: null,
        completed: false
      },
      {
        step: 3,
        title: "Food Picked Up / En Route",
        description: "Food collected from donor location.",
        timestamp: null,
        completed: false
      },
      {
        step: 4,
        title: "Delivered & Distributed",
        description: "Meals safely delivered to community.",
        timestamp: null,
        completed: false
      }
    ];
  }
  next();
});

module.exports = mongoose.models.Donation || mongoose.model("Donation", DonationSchema);

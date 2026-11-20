const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true
    },
    ngo: {
      type: String,
      default: "FoodRescue",
      trim: true
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5
    },
    text: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
      minlength: 10
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// models/JourneyDetails.js (复数形式)
const mongoose = require("mongoose");

const JourneyDetailsSchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      required: true,
    },

    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    journalText: {
      type: String,
      required: true,
    },

    journalPhoto: {
      type: String,
      required: false,
    },

    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journeys",
      required: true,
    },

    // New fields for social features
    likesCount: {
      type: Number,
      default: 0,
    },

    bookmarksCount: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "JourneyDetails",
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  }
);

// Indexes for better performance
JourneyDetailsSchema.index({ location: "2dsphere" });
JourneyDetailsSchema.index({ journeyId: 1, time: 1 });

// Virtual fields to check if current user has liked/bookmarked
JourneyDetailsSchema.virtual("isLiked").get(function () {
  return this._isLiked || false;
});

JourneyDetailsSchema.virtual("isBookmarked").get(function () {
  return this._isBookmarked || false;
});

// Ensure virtuals are included in JSON output
JourneyDetailsSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("JourneyDetails", JourneyDetailsSchema);

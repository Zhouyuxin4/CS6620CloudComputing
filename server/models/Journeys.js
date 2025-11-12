// models/Journeys.js (Updated with social features)
const mongoose = require("mongoose");

const JourneySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    details: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JourneyDetails",
      },
    ],

    userName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },

    // New fields for social features
    isPublic: {
      type: Boolean,
      default: true, // Allow users to make journeys private
    },

    // Cached counts for performance
    likesCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },

    // Optional: Featured image for journey preview
    coverImage: {
      type: String,
      default: null,
    },
  },
  {
    collection: "Journeys",
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Virtual fields to check if current user has liked/bookmarked
// These will be populated in the controller
JourneySchema.virtual("isLiked").get(function () {
  return this._isLiked || false;
});

JourneySchema.virtual("isBookmarked").get(function () {
  return this._isBookmarked || false;
});

// Ensure virtuals are included in JSON output
JourneySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Journeys", JourneySchema);

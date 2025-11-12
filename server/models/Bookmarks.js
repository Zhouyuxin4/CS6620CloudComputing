// models/Bookmarks.js
const mongoose = require("mongoose");

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["Journeys", "JourneyDetails"],
    },
  },
  {
    collection: "bookmarks",
    timestamps: true,
  }
);

// Ensure a user can only bookmark something once
BookmarkSchema.index(
  { userId: 1, targetId: 1, targetModel: 1 },
  { unique: true }
);

module.exports = mongoose.model("Bookmarks", BookmarkSchema);

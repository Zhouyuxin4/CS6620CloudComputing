const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
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
      enum: ["Journeys", "JourneyDetails", "Comments"], // Can like journeys, journey details, or comments
    },
  },
  {
    collection: "Likes",
    timestamps: true,
  }
);

// Compound index to ensure a user can only like something once
LikeSchema.index({ userId: 1, targetId: 1, targetModel: 1 }, { unique: true });
// Index for finding all likes for a specific target
LikeSchema.index({ targetId: 1, targetModel: 1 });

module.exports = mongoose.model("Likes", LikeSchema);

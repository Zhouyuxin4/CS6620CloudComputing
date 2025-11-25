// ============================================
// models/Notifications.js (for real-time notifications)
// ============================================
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "journey_liked",
        "detail_liked",
        "journey_commented",
        "journey_bookmarked",
        "comment_replied",
        "comment_liked",
        "new_follower",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["Journeys", "JourneyDetails", "Comments", "Users"],
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "notifications",
    timestamps: true,
  }
);

// Indexes for efficient queries
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model("notifications", NotificationSchema);

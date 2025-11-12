// ============================================
// models/Comments.js
// ============================================
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journeys",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // For reply functionality
    isReply: {
      type: Boolean,
      default: false,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
      default: null,
    },
    replyToUser: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      userName: String, // Cache username for display
    },

    // Cached counts for performance
    likesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "Comments",
    timestamps: true,
  }
);

// Indexes for efficient queries
CommentSchema.index({ journeyId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ userId: 1 });

module.exports = mongoose.model("Comments", CommentSchema);

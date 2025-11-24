// controllers/socialController.js
const Likes = require("../models/Likes");
const Bookmarks = require("../models/Bookmarks");
const Comments = require("../models/Comments");
const Journeys = require("../models/Journeys");
const JourneyDetails = require("../models/JourneyDetails");
const Users = require("../models/Users");
const Notifications = require("../models/Notifications");

// ============ LIKES FUNCTIONALITY ============

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId, targetModel } = req.params;

    console.log("👍 [toggleLike] Request:", { userId, targetId, targetModel });

    // 验证参数
    if (!targetId || targetId === "undefined") {
      console.error("❌ Invalid targetId:", targetId);
      return res.status(400).json({ message: "Invalid target ID" });
    }

    if (!userId) {
      console.error("❌ No userId found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 验证 targetModel
    const validModels = ["Journeys", "JourneyDetails", "Comments"];
    if (!validModels.includes(targetModel)) {
      console.error("❌ Invalid target model:", targetModel);
      return res.status(400).json({
        message: "Invalid target model",
        received: targetModel,
        expected: validModels,
      });
    }

    console.log("✅ Validation passed");

    // 检查是否已点赞
    const existingLike = await Likes.findOne({
      userId,
      targetId,
      targetModel,
    });

    console.log("Existing like:", existingLike ? "Found" : "Not found");

    let isLiked;
    let likesCount;

    if (existingLike) {
      // Unlike
      await existingLike.deleteOne();
      isLiked = false;

      let updateResult;
      if (targetModel === "Journeys") {
        updateResult = await Journeys.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: -1 } },
          { new: true }
        );
      } else if (targetModel === "JourneyDetails") {
        updateResult = await JourneyDetails.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: -1 } },
          { new: true }
        );
      } else {
        updateResult = await Comments.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: -1 } },
          { new: true }
        );
      }

      if (!updateResult) {
        console.error("❌ Target not found:", targetId);
        return res.status(404).json({ message: "Target not found" });
      }

      likesCount = updateResult.likesCount;
      console.log("👎 Unliked, new count:", likesCount);
    } else {
      // Like
      const newLike = new Likes({
        userId,
        targetId,
        targetModel,
      });
      await newLike.save();
      isLiked = true;

      let updateResult;
      if (targetModel === "Journeys") {
        updateResult = await Journeys.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: 1 } },
          { new: true }
        ).populate("userName");

        // Create notification
        if (updateResult && updateResult.userName._id.toString() !== userId) {
          const user = await Users.findById(userId);
          await createNotification(
            {
              recipientId: updateResult.userName._id,
              senderId: userId,
              type: "journey_liked",
              targetId: targetId,
              targetModel: "Journeys",
              message: `${user.userName} liked your journey "${updateResult.title}"`,
            },
            req
          );
        }
      } else if (targetModel === "JourneyDetails") {
        updateResult = await JourneyDetails.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: 1 } },
          { new: true }
        ).populate({
          path: "journeyId",
          populate: { path: "userName" },
        });

        // Create notification
        if (
          updateResult &&
          updateResult.journeyId.userName._id.toString() !== userId
        ) {
          const user = await Users.findById(userId);
          await createNotification(
            {
              recipientId: updateResult.userName._id,
              senderId: userId,
              type: "journey_liked",
              targetId: targetId,
              targetModel: "Journeys",
              message: `${user.userName} liked your journey "${updateResult.title}"`,
            },
            req
          );
        }
      } else {
        updateResult = await Comments.findByIdAndUpdate(
          targetId,
          { $inc: { likesCount: 1 } },
          { new: true }
        ).populate("userId");

        // Create notification
        if (updateResult && updateResult.userId._id.toString() !== userId) {
          const user = await Users.findById(userId);
          await createNotification(
            {
              recipientId: updateResult.userName._id,
              senderId: userId,
              type: "journey_liked",
              targetId: targetId,
              targetModel: "Journeys",
              message: `${user.userName} liked your journey "${updateResult.title}"`,
            },
            req
          );
        }
      }

      if (!updateResult) {
        console.error("❌ Target not found:", targetId);
        return res.status(404).json({ message: "Target not found" });
      }

      likesCount = updateResult.likesCount;
      console.log("👍 Liked, new count:", likesCount);
    }

    console.log("✅ Sending response:", { isLiked, likesCount });
    res.status(200).json({
      isLiked,
      likesCount,
      message: isLiked ? "Liked successfully" : "Unliked successfully",
    });
  } catch (error) {
    console.error("❌ [toggleLike] Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get list of users who liked something
exports.getLikes = async (req, res) => {
  try {
    const { targetId, targetModel } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const likes = await Likes.find({
      targetId,
      targetModel,
    })
      .populate("userId", "userName profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalLikes = await Likes.countDocuments({
      targetId,
      targetModel,
    });

    res.status(200).json({
      likes: likes.map((like) => like.userId),
      totalLikes,
      currentPage: page,
      totalPages: Math.ceil(totalLikes / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ BOOKMARKS FUNCTIONALITY ============

// Toggle bookmark for journey or journey detail
exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId, targetModel } = req.params;

    // Validate targetModel
    if (!["Journeys", "JourneyDetails"].includes(targetModel)) {
      return res.status(400).json({ message: "Invalid target model" });
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmarks.findOne({
      userId,
      targetId,
      targetModel,
    });

    let isBookmarked;
    let bookmarksCount;

    if (existingBookmark) {
      // Remove bookmark
      await existingBookmark.deleteOne();
      isBookmarked = false;

      // Update count
      if (targetModel === "Journeys") {
        const journey = await Journeys.findByIdAndUpdate(
          targetId,
          { $inc: { bookmarksCount: -1 } },
          { new: true }
        );
        bookmarksCount = journey.bookmarksCount;
      } else {
        const detail = await JourneyDetails.findByIdAndUpdate(
          targetId,
          { $inc: { bookmarksCount: -1 } },
          { new: true }
        );
        bookmarksCount = detail.bookmarksCount;
      }
    } else {
      // Add bookmark
      const newBookmark = new Bookmarks({
        userId,
        targetId,
        targetModel,
      });
      await newBookmark.save();
      isBookmarked = true;

      // Update count
      if (targetModel === "Journeys") {
        const journey = await Journeys.findByIdAndUpdate(
          targetId,
          { $inc: { bookmarksCount: 1 } },
          { new: true }
        );
        bookmarksCount = journey.bookmarksCount;
      } else {
        const detail = await JourneyDetails.findByIdAndUpdate(
          targetId,
          { $inc: { bookmarksCount: 1 } },
          { new: true }
        );
        bookmarksCount = detail.bookmarksCount;
      }
    }

    res.status(200).json({
      isBookmarked,
      bookmarksCount,
      message: isBookmarked
        ? "Bookmarked successfully"
        : "Unbookmarked successfully",
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's bookmarked journeys and details
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const targetModel = req.query.type || "all"; // 'Journeys', 'JourneyDetails', or 'all'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    let query = { userId };
    if (targetModel !== "all") {
      query.targetModel = targetModel;
    }

    const bookmarks = await Bookmarks.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Populate based on targetModel
    const populatedBookmarks = [];
    for (const bookmark of bookmarks) {
      let populatedItem;
      if (bookmark.targetModel === "Journeys") {
        populatedItem = await Journeys.findById(bookmark.targetId).populate(
          "userName",
          "userName profilePicture"
        );
      } else {
        populatedItem = await JourneyDetails.findById(
          bookmark.targetId
        ).populate({
          path: "journeyId",
          select: "title userName",
          populate: {
            path: "userName",
            select: "userName profilePicture",
          },
        });
      }

      if (populatedItem) {
        populatedBookmarks.push({
          _id: bookmark._id,
          type: bookmark.targetModel,
          content: populatedItem,
          bookmarkedAt: bookmark.createdAt,
        });
      }
    }

    const totalBookmarks = await Bookmarks.countDocuments(query);

    res.status(200).json({
      bookmarks: populatedBookmarks,
      totalBookmarks,
      currentPage: page,
      totalPages: Math.ceil(totalBookmarks / limit),
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============ COMMENTS FUNCTIONALITY ============

// Create a new comment or reply
exports.createComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { journeyId } = req.params;
    const { content, parentCommentId, replyToUserId } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const commentData = {
      journeyId,
      userId,
      content: content.trim(),
    };

    // If this is a reply
    if (parentCommentId) {
      // Verify parent comment exists
      const parentComment = await Comments.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      // Prevent replying to a reply
      if (parentComment.isReply) {
        return res.status(400).json({ message: "Cannot reply to a reply" });
      }

      commentData.isReply = true;
      commentData.parentCommentId = parentCommentId;

      // Add reply-to user info if provided
      if (replyToUserId) {
        const replyToUser = await Users.findById(replyToUserId);
        if (replyToUser) {
          commentData.replyToUser = {
            userId: replyToUserId,
            userName: replyToUser.userName,
          };
        }
      }

      // Increment reply count on parent comment
      await Comments.findByIdAndUpdate(parentCommentId, {
        $inc: { repliesCount: 1 },
      });
    }

    // Create and save comment
    const newComment = new Comments(commentData);
    await newComment.save();

    // Populate user info for response
    await newComment.populate("userId", "userName profilePicture");

    // Update journey comment count
    const journey = await Journeys.findByIdAndUpdate(
      journeyId,
      { $inc: { commentsCount: 1 } },
      { new: true }
    ).populate("userName");

    // Create notifications
    const user = await Users.findById(userId);

    if (!parentCommentId && journey.userName._id.toString() !== userId) {
      // Notification for journey owner
      await createNotification(
        {
          recipientId: journey.userName._id,
          senderId: userId,
          type: "journey_commented",
          targetId: journeyId,
          targetModel: "Journeys",
          message: `${user.userName} commented on your journey "${journey.title}"`,
        },
        req
      );
    } else if (parentCommentId) {
      // Notification for comment owner
      const parentComment = await Comments.findById(parentCommentId).populate(
        "userId"
      );
      if (parentComment.userId._id.toString() !== userId) {
        await createNotification(
          {
            recipientId: parentComment.userId._id,
            senderId: userId,
            type: "comment_replied",
            targetId: parentCommentId,
            targetModel: "Comments",
            message: `${user.userName} replied to your comment`,
          },
          req
        );
      }
    }

    res.status(201).json({
      comment: newComment,
      message: "Comment posted successfully",
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get comments for a journey
exports.getComments = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user?.userId;

    // Get main comments (not replies)
    const mainComments = await Comments.find({
      journeyId,
      isReply: false,
    })
      .populate("userId", "userName profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get replies for these comments
    const commentIds = mainComments.map((c) => c._id);
    const replies = await Comments.find({
      parentCommentId: { $in: commentIds },
    })
      .populate("userId", "userName profilePicture")
      .populate("replyToUser.userId", "userName")
      .sort({ createdAt: 1 }); // Oldest first for replies

    // Group replies by parent comment
    const repliesByParent = {};
    replies.forEach((reply) => {
      if (!repliesByParent[reply.parentCommentId]) {
        repliesByParent[reply.parentCommentId] = [];
      }
      repliesByParent[reply.parentCommentId].push(reply);
    });

    // Check if current user has liked each comment
    let userLikes = [];
    if (userId) {
      const commentAndReplyIds = [...commentIds, ...replies.map((r) => r._id)];
      userLikes = await Likes.find({
        userId,
        targetId: { $in: commentAndReplyIds },
        targetModel: "Comments",
      });
    }
    const likedIds = new Set(userLikes.map((l) => l.targetId.toString()));

    // Format response
    const formattedComments = mainComments.map((comment) => {
      const commentObj = comment.toObject();
      commentObj.replies = repliesByParent[comment._id] || [];
      commentObj.isLiked = likedIds.has(comment._id.toString());

      // Add isLiked for each reply
      commentObj.replies = commentObj.replies.map((reply) => ({
        ...reply.toObject(),
        isLiked: likedIds.has(reply._id.toString()),
      }));

      return commentObj;
    });

    const totalComments = await Comments.countDocuments({
      journeyId,
      isReply: false,
    });

    res.status(200).json({
      comments: formattedComments,
      totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: page < Math.ceil(totalComments / limit),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { commentId } = req.params;

    // Find the comment
    const comment = await Comments.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    // If it's a main comment, delete all its replies
    if (!comment.isReply) {
      const replies = await Comments.find({ parentCommentId: commentId });
      const replyCount = replies.length;

      // Delete all replies
      await Comments.deleteMany({ parentCommentId: commentId });

      // Delete likes for replies
      await Likes.deleteMany({
        targetId: { $in: replies.map((r) => r._id) },
        targetModel: "Comments",
      });

      // Update journey comment count
      await Journeys.findByIdAndUpdate(comment.journeyId, {
        $inc: { commentsCount: -(1 + replyCount) },
      });
    } else {
      // If it's a reply, update parent comment's reply count
      await Comments.findByIdAndUpdate(comment.parentCommentId, {
        $inc: { repliesCount: -1 },
      });

      // Update journey comment count
      await Journeys.findByIdAndUpdate(comment.journeyId, {
        $inc: { commentsCount: -1 },
      });
    }

    // Delete the comment
    await comment.deleteOne();

    // Delete likes for this comment
    await Likes.deleteMany({
      targetId: commentId,
      targetModel: "Comments",
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============ HELPER FUNCTIONS ============

// Create notification helper
async function createNotification(notificationData, req) {
  try {
    const notification = new Notifications(notificationData);
    await notification.save();

    // 🆕 添加Socket.io实时推送
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${notificationData.recipientId}`).emit("new-notification", {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        senderId: notification.senderId,
        targetId: notification.targetId,
        targetModel: notification.targetModel,
        createdAt: notification.createdAt,
        isRead: false,
      });
      console.log(
        `📤 Sent notification to user_${notificationData.recipientId}`
      );
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
}

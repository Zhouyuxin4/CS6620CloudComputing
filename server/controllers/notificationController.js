// controllers/notificationController.js
const Notifications = require("../models/Notifications");
const Users = require("../models/Users");
const { createNotification } = require("../services/notificationService");

// Send a test notification (For latency testing)
exports.sendTestNotification = async (req, res) => {
  try {
    const { recipientId, senderId } = req.body;
    
    if (!recipientId) {
        return res.status(400).json({ message: "recipientId is required" });
    }

    // Use provided senderId or fallback to recipientId (self)
    // In a real scenario, senderId would come from auth token
    const actualSenderId = senderId || recipientId;

    const notification = await createNotification({
        recipientId,
        senderId: actualSenderId, 
        type: "new_follower", // valid enum value
        message: "Real Interaction Test",
        targetId: actualSenderId, // self
        targetModel: "Users"
    }, req);

    res.status(200).json({ message: "Notification sent", notification });
  } catch (error) {
    console.error("Test notification error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = req.query.filter || "all"; // all, unread, read

    // Build query
    let query = { recipientId: userId };
    if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "read") {
      query.isRead = true;
    }

    // Get notifications with sender info
    const notifications = await Notifications.find(query)
      .populate("senderId", "userName profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get unread count
    const unreadCount = await Notifications.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    // Get total count for pagination
    const totalNotifications = await Notifications.countDocuments(query);

    // Format notifications with sender info
    const formattedNotifications = notifications.map((notif) => ({
      _id: notif._id,
      type: notif.type,
      message: notif.message,
      targetId: notif.targetId,
      targetModel: notif.targetModel,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      senderInfo: notif.senderId
        ? {
            _id: notif.senderId._id,
            userName: notif.senderId.userName,
            profilePicture: notif.senderId.profilePicture,
          }
        : null,
      // Add journeyId for navigation (for comment notifications)
      journeyId: notif.journeyId || notif.targetId,
    }));

    res.status(200).json({
      notifications: formattedNotifications,
      unreadCount,
      totalNotifications,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
      hasMore: page < Math.ceil(totalNotifications / limit),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notification = await Notifications.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notifications.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      { isRead: true }
    );

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notification = await Notifications.findOneAndDelete({
      _id: notificationId,
      recipientId: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notifications.deleteMany({
      recipientId: userId,
    });

    res.status(200).json({
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get unread notification count (for badge display)
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await Notifications.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: error.message });
  }
};

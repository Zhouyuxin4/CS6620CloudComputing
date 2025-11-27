// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Get user's notifications
router.get("/", authenticateToken, notificationController.getNotifications);

// Get unread count (for badge)
router.get(
  "/unread-count",
  authenticateToken,
  notificationController.getUnreadCount
);

// Send test notification (No auth for easier testing, or use auth if preferred)
router.post(
    "/test",
    notificationController.sendTestNotification
);

// Mark notification as read
router.put(
  "/:notificationId/read",
  authenticateToken,
  notificationController.markAsRead
);

// Mark all as read
router.put(
  "/read-all",
  authenticateToken,
  notificationController.markAllAsRead
);

// Delete a notification
router.delete(
  "/:notificationId",
  authenticateToken,
  notificationController.deleteNotification
);

// Clear all notifications
router.delete(
  "/clear-all",
  authenticateToken,
  notificationController.clearAllNotifications
);

module.exports = router;

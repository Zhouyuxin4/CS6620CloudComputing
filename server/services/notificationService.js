const Notifications = require("../models/Notifications");
const { pushMetric } = require("../utils/cloudwatchHelper");

let totalNotificationsSent = 0;

async function createNotification(notificationData, req) {
  try {
    const notification = new Notifications(notificationData);
    await notification.save();

    const io = req?.app?.get("io");
    if (io) {
      io.to(`user_${notificationData.recipientId}`).emit("new-notification", {
        ...notificationData,
        _id: notification._id,
        createdAt: notification.createdAt,
        isRead: false,
      });

      totalNotificationsSent++;
      // console.log(
      //   `📤 Sent notification #${totalNotificationsSent} to user_${notificationData.recipientId}`
      // );

      pushMetric("NotificationsSent", 1, "Count");
      pushMetric("NotificationType", 1, "Count", notificationData.type);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    pushMetric("NotificationErrors", 1, "Count");
    throw error;
  }
}

module.exports = { createNotification };

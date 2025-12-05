const Notifications = require("../models/Notifications");
const { pushMetric } = require("../utils/cloudwatchHelper");

let totalNotificationsSent = 0;

async function createNotification(notificationData, req) {
  try {
    const notification = new Notifications(notificationData);
    await notification.save();

    // 改用 Redis publish 发送通知
    const redisPub = req?.app?.get("redisPub");
    if (redisPub) {
      const message = JSON.stringify({
        recipientId: notificationData.recipientId,
        notification: {
          ...notificationData,
          _id: notification._id,
          createdAt: notification.createdAt,
          isRead: false,
        },
      });

      redisPub.publish("notifications", message);

      totalNotificationsSent++;
      console.log(
        `📤 Published notification #${totalNotificationsSent} for user_${notificationData.recipientId}`
      );

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

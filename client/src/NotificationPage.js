// NotificationPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Cookies from "js-cookie";
import api from "./api";
import "./css/Notification.css";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const userName = Cookies.get("userName");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      console.log("Notifications fetched:", response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Handle notification click - navigate to relevant content
  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "journey_liked":
      case "journey_commented":
      case "detail_liked":
        navigate(
          `/journey/${
            notification.targetModel === "JourneyDetails"
              ? notification.journeyId
              : notification.targetId
          }`
        );
        break;
      case "comment_replied":
      case "comment_liked":
        // Navigate to the journey where the comment is
        navigate(`/journey/${notification.journeyId}`);
        break;
      case "new_follower":
        navigate("/friends");
        break;
      default:
        break;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "journey_liked":
      case "detail_liked":
      case "comment_liked":
        return "❤️";
      case "journey_commented":
      case "comment_replied":
        return "💬";
      case "new_follower":
        return "👤";
      default:
        return "🔔";
    }
  };

  // Filter notifications
  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "read":
        return notifications.filter((n) => n.isRead);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Layout userName={userName}>
      <div className="notification-page">
        <div className="notification-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>

        {/* Filter and Actions Bar */}
        <div className="notification-controls">
          <div className="filter-buttons">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              Unread
            </button>
            <button
              className={filter === "read" ? "active" : ""}
              onClick={() => setFilter("read")}
            >
              Read
            </button>
          </div>

          <div className="action-buttons">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="clear-all">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-container">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : filteredNotifications.length > 0 ? (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    !notification.isRead ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-main">
                      {notification.senderInfo && (
                        <img
                          src={
                            notification.senderInfo.profilePicture ||
                            "https://via.placeholder.com/40"
                          }
                          alt={notification.senderInfo.userName}
                          className="sender-avatar"
                        />
                      )}
                      <p className="notification-message">
                        {notification.message}
                      </p>
                    </div>
                    <span className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-notifications">
              <p>
                {filter === "unread"
                  ? "No unread notifications"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </p>
            </div>
          )}
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/homepageafterlogin")}
        >
          Back to Homepage
        </button>
      </div>
    </Layout>
  );
}

export default NotificationPage;

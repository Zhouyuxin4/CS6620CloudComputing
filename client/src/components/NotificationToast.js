// components/NotificationToast.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/NotificationToast.css";

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation
  };

  const handleClick = () => {
    // Navigate based on notification type
    switch (notification.type) {
      case "journey_liked":
      case "journey_commented":
      case "journey_bookmarked":
        navigate(`/journey/${notification.targetId}`);
        break;
      case "detail_liked":
        navigate(`/journey/${notification.journeyId || notification.targetId}`);
        break;
      case "comment_replied":
      case "comment_liked":
        navigate(`/journey/${notification.journeyId}`);
        break;
      case "new_follower":
        navigate("/friends");
        break;
      default:
        navigate("/notifications");
        break;
    }
    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "journey_liked":
      case "detail_liked":
      case "comment_liked":
        return "❤️";
      case "journey_commented":
      case "comment_replied":
        return "💬";
      case "journey_bookmarked":
        return "🔖";
      case "new_follower":
        return "👤";
      default:
        return "🔔";
    }
  };

  return (
    <div
      className={`notification-toast ${isVisible ? "visible" : ""}`}
      onClick={handleClick}
    >
      <div className="toast-icon">{getNotificationIcon(notification.type)}</div>
      <div className="toast-content">
        <p className="toast-message">{notification.message}</p>
        <span className="toast-time">Just now</span>
      </div>
      <button className="toast-close" onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}>
        ×
      </button>
    </div>
  );
};

export default NotificationToast;



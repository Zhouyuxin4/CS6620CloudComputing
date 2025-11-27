import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./css/Header.css";
import handleLogout from "./HomepageAfterLogin.js";
import api from "./api";
import socketService from "./services/socketService";

const Header = ({ userName }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const handleScroll = (className) => {
    setTimeout(() => {
      const element = document.querySelector(className);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // Fetch unread notification count
  useEffect(() => {
    if (userName) {
      fetchUnreadCount();

      // Listen for new notifications to update count
      const handleNewNotification = () => {
        setUnreadCount((prev) => prev + 1);
      };

      socketService.on("new-notification", handleNewNotification);

      // Refresh count periodically
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

      return () => {
        socketService.off("new-notification", handleNewNotification);
        clearInterval(interval);
      };
    }
  }, [userName]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <header>
      <nav>
        <div className="logo">
          <Link to="/">
            <img
              src={require("./image/logo.png")}
              alt="Your Own Planet"
              className="logo-image"
            />
          </Link>
        </div>
        <div className="nav-links">
          {userName ? (
            <>
              <Link to="/HomepageAfterLogin">Footprints</Link>
              <Link to="/search">Search</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/friends">Friends</Link>
              <Link to="/notifications" className="notification-link">
                Notifications
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>
              <Link to="/" onClick={handleLogout}>
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => handleScroll(".intro-box")}>
                Home
              </Link>
              <Link to="/" onClick={() => handleScroll(".detail-intro")}>
                About
              </Link>
              <Link to="/signin">Sign In</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

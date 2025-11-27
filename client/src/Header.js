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
      // Ensure socket is connected before setting listeners
      if (!socketService.isConnected()) {
        socketService.connect();
      }

      fetchUnreadCount();

      // Listen for new notifications to update count
      const handleNewNotification = () => {
        setUnreadCount((prev) => prev + 1);
      };

      // Use a slight delay or check connection to avoid "Socket not connected" race condition
      // Better: The socketService.on method should ideally queue or handle this, 
      // but let's make sure we call connect first (above).
      // We'll wrap this in a try-catch just in case the synchronous connect() isn't instant enough for the check inside .on()
      try {
        socketService.on("new-notification", handleNewNotification);
      } catch (error) {
        console.error("Error setting up notification listener:", error);
      }

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

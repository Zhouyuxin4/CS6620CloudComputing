import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Homepage from "./Homepage";
import SignIn from "./SignIn";
import HomepageAfterLogin from "./HomepageAfterLogin";
import ProfilePage from "./ProfilePage";
import JourneyDetails from "./JourneyDetails";
import SearchPage from "./SearchPage";
import FriendPage from "./FriendPage";
import NotificationPage from "./NotificationPage";
import NotificationToast from "./components/NotificationToast";
import socketService from "./services/socketService";
import notificationService from "./services/notificationService";

function App() {
  const [userProfile, setUserProfile] = useState({
    id: "",
    theme: "light",
  });
  const [notifications, setNotifications] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const updateUserProfile = (updatedProfile) => {
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      ...updatedProfile,
    }));
  };

  // Check authentication and setup WebSocket
  useEffect(() => {
    const user = Cookies.get("user");
    const token = Cookies.get("token");
    
    console.log("🔄 App useEffect running - checking auth...");
    console.log("User cookie exists:", !!user);
    console.log("Token cookie exists:", !!token);
    
    if (user && token) {
      setIsAuthenticated(true);
      console.log("✅ Authenticated - setting up WebSocket...");
      
      // Request browser notification permission
      requestNotificationPermission();
      
      // Connect to WebSocket
      if (!socketService.isConnected()) {
        socketService.connect();
        console.log("🔌 Connecting to WebSocket...");
      } else {
        console.log("✅ WebSocket already connected");
      }

      // Listen for new notifications
      const handleNewNotification = (notification) => {
        console.log("🔔 [APP.JS] New notification received:", notification);
        
        // Add to notifications array (for toast)
        setNotifications((prev) => {
          const updated = [
            ...prev,
            { ...notification, id: Date.now() + Math.random() },
          ];
          console.log("🔔 Notifications updated! Total:", updated.length);
          return updated;
        });

        // Play notification sound
        console.log("🔊 Playing notification sound...");
        playNotificationSound();

        // Show browser notification only in HTTPS (if permission granted)
        if (window.isSecureContext) {
          console.log("🔔 Showing browser notification...");
          notificationService.showNotification(notification);
        } else {
          console.log("ℹ️ Browser notification skipped (HTTP environment)");
        }
      };

      console.log("👂 Registering notification listener...");
      socketService.on("new-notification", handleNewNotification);

      // Cleanup
      return () => {
        console.log("🧹 Cleaning up notification listener...");
        socketService.off("new-notification", handleNewNotification);
      };
    } else {
      setIsAuthenticated(false);
      console.log("❌ Not authenticated");
      
      // Disconnect WebSocket if not authenticated
      if (socketService.isConnected()) {
        socketService.disconnect();
        console.log("🔌 Disconnected from WebSocket");
      }
    }
  }, []); // 🔥 Changed to empty array to avoid re-registering on every route change

  // Remove notification from toast
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    
    if (!isSecure) {
      console.log("ℹ️ HTTP environment detected - browser notifications disabled");
      console.log("ℹ️ In-app toasts and sounds will still work!");
      return;
    }
    
    if (notificationService.isSupported()) {
      const permission = notificationService.getPermission();
      
      if (permission === 'default') {
        // Only ask once per session
        const hasAsked = sessionStorage.getItem('notification-permission-asked');
        if (!hasAsked) {
          console.log("📱 Requesting browser notification permission...");
          const granted = await notificationService.requestPermission();
          sessionStorage.setItem('notification-permission-asked', 'true');
          
          if (granted) {
            console.log("✅ Browser notifications enabled!");
          } else {
            console.log("ℹ️ Browser notifications not enabled (you can still see in-app toasts)");
          }
        }
      } else if (permission === 'granted') {
        console.log("✅ Browser notifications already enabled");
        await notificationService.registerServiceWorker();
      }
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple notification beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound: pleasant notification tone
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      // Fade in/out for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      console.log("🔊 Notification sound played");
    } catch (error) {
      console.error("❌ Audio error:", error);
    }
  };

  // 🧪 TEST FUNCTION - Expose to window for debugging
  React.useEffect(() => {
    window.testNotification = () => {
      console.log("🧪 Manually triggering test notification...");
      const testNotif = {
        type: "new_follower",
        message: "Test User started following you (Manual Test)",
        recipientId: "test",
        senderId: "test",
        id: Date.now(),
      };
      setNotifications((prev) => [...prev, testNotif]);
      playNotificationSound();
      console.log("✅ Test notification added!");
    };
    console.log("🧪 Test function ready: type window.testNotification() in console");
  }, []);

  return (
    <>
      {/* Notification Toasts Container */}
      {isAuthenticated && (
        <div className="notification-toast-container">
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignIn />} />
        <Route path="/homepageafterlogin" element={<HomepageAfterLogin />} />
        <Route
          path="/profile"
          element={
            <ProfilePage
              userProfile={userProfile}
              updateUserProfile={updateUserProfile}
            />
          }
        />
        <Route path="/journey/:id" element={<JourneyDetails />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/friends" element={<FriendPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
      </Routes>
    </>
  );
}

export default App;

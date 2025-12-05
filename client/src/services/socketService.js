// services/socketService.js
import { io } from "socket.io-client";
import Cookies from "js-cookie";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    const API_URL = "https://yopapi.online";
    
    this.socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket.id);
      
      // Authenticate with user ID
      const user = Cookies.get("user");
      console.log("🔍 Debug - User cookie:", user);
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          console.log("🔍 Debug - Parsed user data:", userData);
          
          // Try different possible user ID fields
          const userId = userData._id || userData.id || userData.userId;
          
          if (userId) {
            this.socket.emit("authenticate", userId);
            console.log("🔐 Authenticated with user ID:", userId);
          } else {
            console.error("❌ No user ID found in cookie! User data:", userData);
          }
        } catch (error) {
          console.error("❌ Failed to parse user data:", error);
        }
      } else {
        console.warn("⚠️ No user cookie found");
      }
    });

    this.socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("WebSocket disconnected");
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn("Socket not connected when calling .on(). Attempting auto-connect...");
      this.connect();
    }

    // If connect() was called, this.socket might now exist (or be initializing)
    // But if it failed completely, we still need to guard.
    if (this.socket) {
        this.socket.on(event, callback);
        
        // Store listener for cleanup
        if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    } else {
        console.error("Failed to initialize socket for event listener:", event);
    }
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);
    
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.error("Socket not connected. Call connect() first.");
      return;
    }

    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;



import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/SignIn.css";
import Layout from "./Layout";
import Cookies from "js-cookie";
import api from "./api";

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const navigate = useNavigate();

  const handleToggle = () => setIsSignUp(!isSignUp);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      console.log("Signing up:", { userName, password, profilePicture });
      const formData = new FormData();
      formData.append("userName", userName);
      formData.append("password", password);
      console.log(userName);
      console.log(password);
      console.log(formData.values());
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      try {
        const response = await api.post("/users/", formData);
        console.log("User created:", response.data);
        alert("Sign up successfully! Please log in.");
        navigate("/");
      } catch (err) {
        console.error(
          "Sign-up failed:",
          err.response?.data?.message || err.message
        );
        alert(
          err.response?.data?.message || "Sign-up failed. Please try again."
        );
      }
    } else {
      console.log("🔵 [SignIn] Signing in with:", { userName, password });
      
      try {
        console.log("🔵 [SignIn] Attempting POST to /users/login");
        const response = await api.post("/users/login", {
          userName,
          password,
        });

        console.log("🟢 [SignIn] Server response received:", response);
        console.log("🟢 [SignIn] Response data:", response.data);

        const token = response.data.token;
        const user = response.data.user;

        console.log("🟢 [SignIn] Extracted token:", token);
        console.log("🟢 [SignIn] Extracted user:", user);

        if (!token) {
          console.error("🔴 [SignIn] Token is missing from server response!");
          alert("Login failed: Token not received");
          return;
        }

        // 设置 Cookies
        Cookies.set("token", token, { expires: 7, path: "/" });
        Cookies.set("user", JSON.stringify(user), { expires: 7, path: "/" });
        Cookies.set("userName", user.userName, { expires: 7, path: "/" });

        // 验证 Cookie 是否设置成功
        console.log("🔵 [SignIn] Verifying Cookies:");
        console.log("   Token:", Cookies.get("token"));
        console.log("   User:", Cookies.get("user"));
        console.log("   UserName:", Cookies.get("userName"));

        console.log("🔵 [SignIn] Navigating to /homepageafterlogin");
        navigate("/homepageafterlogin");
      } catch (err) {
        console.error("🔴 [SignIn] Login FAILED:", err);
        
        if (err.response) {
            console.error("🔴 [SignIn] Error Response Status:", err.response.status);
            console.error("🔴 [SignIn] Error Response Data:", err.response.data);
            console.error("🔴 [SignIn] Error Response Headers:", err.response.headers);
        } else if (err.request) {
            console.error("🔴 [SignIn] No response received (Network Error?)", err.request);
        } else {
            console.error("🔴 [SignIn] Error setting up request:", err.message);
        }

        alert(
          err.response?.data?.message ||
            "Invalid credentials. Please try again."
        );
      }
    }
  };

  return (
    <Layout>
      <div className="sign-in-up-page">
        <div className="sign-in-box">
          <h1>{isSignUp ? "Sign Up" : "Sign In"}</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <input
                className="signIn-input"
                type="text"
                placeholder="User ID"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                className="signIn-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              {isSignUp && (
                <input
                  type="file"
                  onChange={(e) => setProfilePicture(e.target.files[0])}
                />
              )}
            </div>
            <button type="submit">{isSignUp ? "Sign Up" : "Sign In"}</button>
          </form>
          <button onClick={handleToggle}>
            {isSignUp
              ? "Already have an account? Sign In"
              : "New user? Sign Up"}
          </button>
        </div>
        <div className="background"></div>
      </div>
    </Layout>
  );
}

export default SignIn;

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
      console.log("Signing in:", { userName, password });
      try {
        const response = await api.post("/users/login", {
          userName,
          password,
        });

        console.log("Server response:", response.data);

        const token = response.data.token;
        const user = response.data.user;

        console.log("Extracted token:", token);
        console.log("Extracted user:", user);

        if (!token) {
          console.error("Token is missing from server response!");
          alert("Login failed: Token not received");
          return;
        }

        // 设置 Cookies
        Cookies.set("token", token, { expires: 7, path: "/" });
        Cookies.set("user", JSON.stringify(user), { expires: 7, path: "/" });
        Cookies.set("userName", user.userName, { expires: 7, path: "/" });

        // 验证 Cookie 是否设置成功
        console.log("Cookie token:", Cookies.get("token"));
        console.log("Cookie user:", Cookies.get("user"));
        console.log("Cookie userName:", Cookies.get("userName"));

        navigate("/homepageafterlogin");
      } catch (err) {
        console.error(
          "Login failed:",
          err.response?.data?.message || err.message
        );
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

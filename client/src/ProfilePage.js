import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Profile.css";
import Cookies from "js-cookie";
import Layout from "./Layout";
import api from "./api";

function ProfilePage() {
  const [newUserName, setNewUserName] = useState(""); // ⬅️ 改名：新用户名
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(""); // ⬅️ 添加：当前用户名
  const navigate = useNavigate();

  // ⬅️ 添加：页面加载时获取当前用户信息
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      const user = JSON.parse(userCookie);
      setCurrentUserName(user.userName);
      setNewUserName(user.userName); // 默认显示当前用户名
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentUserName) {
      alert("User not logged in.");
      return;
    }

    console.log("Edit Profile", { newUserName, password, profilePicture });
    const formData = new FormData();

    // ⬅️ 修改：发送新用户名（如果修改了的话）
    if (newUserName && newUserName !== currentUserName) {
      formData.append("userName", newUserName);
    }

    if (password) {
      formData.append("password", password);
    }

    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }

    console.log("Updating user:", currentUserName);
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      // ⬅️ 关键修改：使用当前用户名作为 URL，新用户名在 body 中
      const response = await api.put(`/users/${currentUserName}`, formData);
      const user = response.data;

      // ⬅️ 更新 Cookies
      Cookies.set("user", JSON.stringify(user));
      Cookies.set("userName", user.userName); // 更新用户名 Cookie

      console.log("User profile updated:", user);
      alert("Profile updated successfully!");

      // 返回主页
      navigate("/homepageafterlogin");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(
        "Failed to update profile: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      console.error("User not found in cookies.");
      return alert("User not logged in.");
    }

    const user = JSON.parse(userCookie);

    const isConfirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!isConfirmed) {
      return;
    }

    console.log("delete account", { userName: user.userName });

    try {
      await api.delete(`/users/${user.userName}`);
      console.log("User account deleted.");
      Cookies.remove("user");
      Cookies.remove("token");
      Cookies.remove("userName");
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account.");
    }
  };

  const handleGoBack = () => {
    navigate("/homepageafterlogin");
  };

  return (
    <Layout userName={currentUserName}>
      <div className="profile-page">
        <div className="profile-edit-box">
          <h1>Edit Profile</h1>
          <form onSubmit={handleSave}>
            <div>
              <label htmlFor="userName">Name:</label>
              <input
                className="profile-input"
                type="text"
                name="userName"
                placeholder="User Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
              {currentUserName && newUserName !== currentUserName && (
                <small style={{ color: "#666" }}>
                  Current: {currentUserName} → New: {newUserName}
                </small>
              )}
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                className="profile-input"
                type="password"
                name="password"
                placeholder="New Password (leave blank to keep current)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="profile-img-input">Image:</label>
              <input
                className="profile-img-input"
                id="profile-img-input"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files[0])}
              />
            </div>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={handleDelete}>
              Delete My Account
            </button>
          </form>
          <button onClick={handleGoBack}>Back to Homepage</button>
        </div>
        <div className="profile-background"></div>
      </div>
    </Layout>
  );
}

export default ProfilePage;

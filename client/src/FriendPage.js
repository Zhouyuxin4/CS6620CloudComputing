import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Cookies from "js-cookie";
import "./css/Friend.css";

function FriendPage() {
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const userName = Cookies.get("userName");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get("http://localhost:3000/friends/list", {
        withCredentials: true,
      });
      setFriends(response.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("Please enter a username to search");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/friends/search/${keyword}`,
        { withCredentials: true }
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error("Error searching users:", err);
      alert("Search failed");
    }
  };

  const handleAddFriend = async (friendId, friendName) => {
    try {
      await axios.post(
        `http://localhost:3000/friends/add/${friendId}`,
        {},
        { withCredentials: true }
      );
      alert(`${friendName} added as friend!`);
      fetchFriends(); // 刷新好友列表
      setSearchResults([]); // 清空搜索结果
      setKeyword("");
    } catch (err) {
      console.error("Error adding friend:", err);
      alert("Failed to add friend");
    }
  };

  const handleGoBack = () => {
    navigate("/homepageafterlogin");
  };

  return (
    <Layout userName={userName}>
      <div className="friend-page">
        <h1>Friends</h1>

        {/* 搜索用户 */}
        <div className="search-section">
          <h2>Search Users</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter username..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results:</h3>
              {searchResults.map((user) => (
                <div key={user._id} className="user-card">
                  <img
                    src={
                      user.profilePicture || "https://via.placeholder.com/50"
                    }
                    alt={user.userName}
                  />
                  <span>{user.userName}</span>
                  <button
                    onClick={() => handleAddFriend(user._id, user.userName)}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 好友列表 */}
        <div className="friends-section">
          <h2>My Friends ({friends.length})</h2>
          {friends.length > 0 ? (
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend._id} className="friend-card">
                  <img
                    src={
                      friend.profilePicture || "https://via.placeholder.com/50"
                    }
                    alt={friend.userName}
                  />
                  <span>{friend.userName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-friends">No friends yet. Search and add some!</p>
          )}
        </div>

        <button className="back-button" onClick={handleGoBack}>
          Back to Homepage
        </button>
      </div>
    </Layout>
  );
}

export default FriendPage;

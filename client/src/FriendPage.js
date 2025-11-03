import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Cookies from "js-cookie";
import "./css/Friend.css";
import api from "./api";

function FriendPage() {
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followingJourneys, setFollowingJourneys] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const userName = Cookies.get("userName");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowing();
    fetchFollowingJourneys();
  }, []);

  // Fetch users that current user is following
  const fetchFollowing = async () => {
    try {
      const response = await api.get("/friends/following");
      setFollowing(response.data);
      const ids = new Set(response.data.map(user => user._id));
      setFollowingIds(ids);
      console.log("Following fetched:", response.data);
    } catch (err) {
      console.error("Error fetching following:", err);
    }
  };

  // Fetch journeys from followed users
  const fetchFollowingJourneys = async () => {
    try {
      const response = await api.get("/friends/following/journeys");
      setFollowingJourneys(response.data);
      console.log("Following journeys fetched:", response.data);
    } catch (err) {
      console.error("Error fetching following journeys:", err);
    }
  };

  // Search for users
  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("Please enter a username to search");
      return;
    }

    try {
      console.log("Searching for:", keyword);
      const response = await api.get(`/friends/search/${keyword}`);
      setSearchResults(response.data);
      console.log("Search results:", response.data);
    } catch (err) {
      console.error("Error searching users:", err);
      alert("Search failed");
    }
  };

  // Follow a user
  const handleFollow = async (userId, userName) => {
    try {
      await api.post(`/friends/follow/${userId}`);
      alert(`You are now following ${userName}!`);
      fetchFollowing();
      fetchFollowingJourneys();
      setSearchResults([]);
      setKeyword("");
    } catch (err) {
      console.error("Error following user:", err);
      alert("Failed to follow user");
    }
  };

  // Unfollow a user
  const handleUnfollow = async (userId, userName) => {
    try {
      await api.delete(`/friends/unfollow/${userId}`);
      alert(`You unfollowed ${userName}`);
      fetchFollowing();
      fetchFollowingJourneys();
    } catch (err) {
      console.error("Error unfollowing user:", err);
      alert("Failed to unfollow user");
    }
  };

  // View journey details
  const handleViewJourney = (journeyId) => {
    navigate(`/journeydetail/${journeyId}`);
  };

  // Format date to relative time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleGoBack = () => {
    navigate("/homepageafterlogin");
  };

  return (
    <Layout userName={userName}>
      <div className="friend-page">
        <h1>Follow & Feed</h1>

        {/* Search and Follow Users Section */}
        <div className="search-section">
          <h2>Search & Follow Users</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search username..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {/* Search Results */}
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
                    className="user-avatar"
                  />
                  <span className="user-name">{user.userName}</span>
                  {followingIds.has(user._id) ? (
                    <button 
                      className="btn-following"
                      onClick={() => handleUnfollow(user._id, user.userName)}
                    >
                      Following
                    </button>
                  ) : (
                    <button 
                      className="btn-follow"
                      onClick={() => handleFollow(user._id, user.userName)}
                    >
                      Follow
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Following List */}
          <div className="following-list">
            <h3>Following ({following.length})</h3>
            {following.length > 0 ? (
              <div className="following-avatars">
                {following.map((user) => (
                  <div key={user._id} className="following-item">
                    <img
                      src={
                        user.profilePicture || "https://via.placeholder.com/40"
                      }
                      alt={user.userName}
                      title={user.userName}
                    />
                    <span>{user.userName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-following">Not following anyone yet. Search and follow users!</p>
            )}
          </div>
        </div>

        {/* Feed from Followed Users */}
        <div className="feed-section">
          <h2>Feed from People You Follow</h2>
          {followingJourneys.length > 0 ? (
            <div className="journeys-feed">
              {followingJourneys.map((journey) => (
                <div key={journey._id} className="journey-card">
                  <div className="journey-header">
                    <img
                      src={
                        journey.userName?.profilePicture ||
                        "https://via.placeholder.com/40"
                      }
                      alt={journey.userName?.userName}
                      className="journey-avatar"
                    />
                    <div className="journey-info">
                      <h3>{journey.userName?.userName}</h3>
                      <p className="journey-time">
                        {formatDate(journey.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="journey-content">
                    <h2>{journey.title}</h2>
                    <p className="journey-details-count">
                      {journey.details?.length || 0} places visited
                    </p>
                  </div>
                  <button
                    className="btn-view-journey"
                    onClick={() => handleViewJourney(journey._id)}
                  >
                    View Journey
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-feed">
              <p>No journeys yet from people you follow.</p>
              <p>Follow more users to see their adventures!</p>
            </div>
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

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/HomepageAfterLogin.css";
import Layout from "./Layout";
import Cookies from "js-cookie";
import api from "./api"; // 使用新的 api

function HomepageAfterLogin({ userProfile }) {
  const [userName, setUserName] = useState("");
  const [journeys, setJourneys] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loginUser = Cookies.get("user");
    if (loginUser) {
      const user = JSON.parse(loginUser);
      setUserName(user.userName);
      setProfilePicture(user.profilePicture);
    }
  }, []);

  const navigate = useNavigate();

  const handleCreateJourney = async (e) => {
    e.preventDefault();
    const userName = Cookies.get("userName");
    if (!userName) {
      console.error("No userName found");
      return;
    }
    const defaultTitle = "My New Journey";
    const defaultDetails = [];
    const journey = { title: defaultTitle, details: defaultDetails };
    console.log("Create a new journey", journey);
    try {
      const response = await api.post(`/journeys/${userName}`, journey);
      const journeyId = response.data._id;
      console.log("Journey created:", response.data);
      navigate(`/journey/${journeyId}`);
    } catch (err) {
      console.error("Failed to create journey:", err);
    }
  };

  useEffect(() => {
    const fetchJourneys = async () => {
      const userName = Cookies.get("userName");
      if (!userName) {
        console.error("No userName found");
        setLoading(false);
        return;
      }

      console.log("Fetching journeys for userName:", userName);
      console.log("Token:", Cookies.get("token"));

      try {
        const response = await api.get(`/journeys/${userName}`);
        console.log("Full API Response:", response.data);

        // FIX: Extract journeys array from response
        if (response.data && response.data.journeys) {
          console.log("Journeys array:", response.data.journeys);
          console.log("Total journeys:", response.data.totalJourneys);
          console.log("Is own profile:", response.data.isOwnProfile);

          setJourneys(response.data.journeys); // ✅ FIXED: Use response.data.journeys
        } else {
          console.error("Unexpected response structure:", response.data);
          setJourneys([]);
        }
      } catch (error) {
        console.error("Error fetching journeys:", error);
        setError(error.message);
        setJourneys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, []);

  const handleJourneyClick = (id, title) => {
    navigate(`/journey/${id}`, {
      state: {
        title: title,
      },
    });
    console.log("Navigating to journey:", title);
  };

  const handleSearchJourney = () => {
    navigate(`/search`);
  };

  const handleLogout = (e) => {
    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userName");
    navigate("/");
  };

  return (
    <Layout userName={userName}>
      <div className="home-page-after-login">
        <box name>
          <h1>Welcome to Your Own Planet, {userName}!</h1>
          <div className="main-container">
            <div className="profile-info-box">
              <div className="profile-info">
                <img
                  src={
                    profilePicture ||
                    "https://via.placeholder.com/150?text=User"
                  }
                  alt="Profile"
                  className="profile-picture"
                />
                <div className="text-info">
                  <h2>Hi, {userName}</h2>
                  <p>
                    You have recorded: {journeys.length}{" "}
                    {journeys.length === 1 ? "journey" : "journeys"}
                  </p>
                </div>
              </div>
              <button onClick={() => navigate("/profile")}>Profile</button>
            </div>
            <div className="historical-footprints">
              <h2>{userName}'s Historical Footprints</h2>
              <div className="journeys-list">
                {loading ? (
                  <div className="loading">Loading journeys...</div>
                ) : error ? (
                  <div className="error">Error: {error}</div>
                ) : journeys && journeys.length > 0 ? (
                  journeys.map((journey) => {
                    console.log("Rendering journey:", journey); // Debug log
                    return journey && journey._id && journey.title ? (
                      <div
                        key={journey._id}
                        className="journey-card"
                        onClick={() =>
                          handleJourneyClick(journey._id, journey.title)
                        }
                      >
                        <h3>{journey.title}</h3>
                        {journey.coverImage && (
                          <img
                            src={journey.coverImage}
                            alt={journey.title}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <p className="journey-meta">
                          Created:{" "}
                          {new Date(journey.createdAt).toLocaleDateString()}
                        </p>
                        <p className="journey-stats">
                          ❤️ {journey.likesCount || 0} | 💬{" "}
                          {journey.commentsCount || 0} | 🔖{" "}
                          {journey.bookmarksCount || 0}
                        </p>
                      </div>
                    ) : null;
                  })
                ) : (
                  <div className="no-journeys">
                    <p>No previous journeys found.</p>
                    <p>Start by creating your first journey!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </box>
        <div className="buttons">
          <button onClick={handleCreateJourney}>Create a New Journey</button>
          <button onClick={handleSearchJourney}>Search Your Journey</button>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </Layout>
  );
}

export default HomepageAfterLogin;

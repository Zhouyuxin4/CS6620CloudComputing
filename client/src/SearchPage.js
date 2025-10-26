import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./css/Search.css";
import Layout from "./Layout";
import API_BASE_URL from "./config";

function SearchPage() {
  //const userName = localStorage.getItem('user.userName');
  const userName = Cookies.get("userName");
  const [keyword, setKeyword] = useState("");
  const [journeys, setJourneys] = useState([]);
  const navigate = useNavigate();

  const handleSearchJourney = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${userName}/search`,
        {
          params: { keyword },
          withCredentials: true,
        }
      );
      setJourneys(response.data);
      console.log("Journeys fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching journeys:", error);
    }
  };

  const handleJourneyClick = (id, title) => {
    navigate(`/journey/${id}`, {
      state: { title },
    });
    console.log("Navigated to journey:", title);
  };

  const handleGoBack = () => {
    navigate("/homepageafterlogin");
  };

  return (
    <Layout userName={userName}>
      <div className="search-page">
        <div className="search-box">
          <h2>Journey Search: Enter Keywords</h2>
          <div className="search-place">
            <input
              className="search-input"
              type="text"
              placeholder="Search Keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button onClick={handleSearchJourney}>Search</button>
          </div>
          <div className="journeys-list">
            {journeys && journeys.length > 0 ? (
              journeys.map((journey) =>
                journey?.title ? (
                  <div
                    key={journey._id}
                    className="journey-card"
                    onClick={() =>
                      handleJourneyClick(journey._id, journey.title)
                    }
                  >
                    <h3>{journey.title}</h3>
                  </div>
                ) : null
              )
            ) : (
              <div className="no-journeys">
                <p>No previous journeys found.</p>
              </div>
            )}
          </div>
          <button onClick={handleGoBack}>Back to My Homepage</button>
        </div>
        <div className="search-background"></div>
      </div>
    </Layout>
  );
}

export default SearchPage;

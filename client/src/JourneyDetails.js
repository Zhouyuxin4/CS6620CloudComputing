// JourneyDetails.js - Updated version with social features
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MapComponent from "./MapComponent";
import Layout from "./Layout";
import Cookies from "js-cookie";
import "./css/JourneyDetails.css";
import api from "./api";
import { LikeButton, BookmarkButton, CommentSection } from "./SocialComponents";

function JourneyDetails() {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [journeyOwner, setJourneyOwner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [newTitle, setAddress] = useState("");
  const [details, setDetails] = useState([]);
  const [userName, setUserName] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTitle, setCurrentTitle] = useState(
    location.state?.title || "My New Journey"
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingDetailId, setEditingDetailId] = useState(null);
  const [editForm, setEditForm] = useState({
    journalText: "",
    journalPhoto: null,
  });

  // Social data states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  const handleStartEdit = (detail) => {
    setEditingDetailId(detail._id);
    setEditForm({
      journalText: detail.journalText || "",
      journalPhoto: detail.journalPhoto || null,
    });
  };

  const handleCancelEdit = () => {
    setEditingDetailId(null);
    setEditForm({
      journalText: "",
      journalPhoto: null,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "journalPhoto" && files) {
      setEditForm((prev) => ({
        ...prev,
        journalPhoto: files[0],
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSaveEdit = async (detailId) => {
    try {
      const updateData = {
        journalText: editForm.journalText,
      };

      const response = await api.put(
        `/details/${id}/${detailId}/update`,
        updateData
      );

      if (response.status === 200) {
        alert("Stop updated successfully");
        setEditingDetailId(null);
        fetchJourneyDetails();
      }
    } catch (error) {
      console.error("Error updating detail:", error);
      alert("Failed to update stop");
    }
  };

  // Fetch journey information including owner and social data
  const fetchJourneyInfo = async () => {
    try {
      const response = await api.get(`/journeys/journey/${id}`);
      const journeyData = response.data.journey || response.data;

      setJourney(journeyData);
      setJourneyOwner(journeyData.userName);
      setCurrentTitle(journeyData.title);

      // Set social data
      setIsLiked(journeyData.isLiked || false);
      setLikesCount(journeyData.likesCount || 0);
      setIsBookmarked(journeyData.isBookmarked || false);
      setBookmarksCount(journeyData.bookmarksCount || 0);
      setCommentsCount(journeyData.commentsCount || 0);

      console.log("Fetched journey with social data:", journeyData);
    } catch (error) {
      console.error("Error fetching journey info:", error);
    }
  };

  // Fetch journey details (stops) with social data
  const fetchJourneyDetails = async () => {
    try {
      const response = await api.get(`/details/${id}/allDetails`);
      setDetails(response.data);
      console.log("Fetched details with social data:", response.data);
    } catch (error) {
      console.error("Error fetching journey details:", error);
    }
  };

  // Check ownership when journey and user info are loaded
  useEffect(() => {
    if (journeyOwner && currentUserId) {
      const isUserOwner = journeyOwner._id === currentUserId;
      setIsOwner(isUserOwner);
    }
  }, [journeyOwner, currentUserId]);

  useEffect(() => {
    if (id) {
      fetchJourneyInfo();
      fetchJourneyDetails();
    }

    const loginUser = Cookies.get("user");
    if (loginUser) {
      const user = JSON.parse(loginUser);
      setUserName(user.userName);
      const userId = user.userId || user.id || user._id;
      setCurrentUserId(userId);
      // Store user info in localStorage for comment component
      localStorage.setItem("user", JSON.stringify({ ...user, id: userId }));
    }
  }, [id]);

  const handleDeleteDetail = async (detailId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this stop?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await api.delete(`/details/${id}/${detailId}`);
      if (response.status === 200) {
        alert("Stop deleted successfully");
        fetchJourneyDetails();
      }
    } catch (error) {
      console.error("Error deleting detail:", error);
      alert("Failed to delete stop");
    }
  };

  const handleUpdateJourney = async () => {
    if (!isOwner) {
      alert("You don't have permission to edit this journey");
      return;
    }

    try {
      if (!newTitle.trim()) {
        alert("Title cannot be empty");
        return;
      }

      const response = await api.put(`/journeys/${id}`, {
        title: newTitle,
      });

      if (response.status === 200) {
        alert("Journey updated successfully");
        setCurrentTitle(newTitle);
        setAddress("");
      }
    } catch (error) {
      console.error("Error updating journey:", error);
      alert("Failed to updating journey");
    }
  };

  const handleDeleteJourney = async () => {
    if (!isOwner) {
      alert("You don't have permission to delete this journey");
      return;
    }

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this journey?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const user = JSON.parse(Cookies.get("user"));
      const response = await api.delete(`/journeys/${user.userName}/${id}`);

      if (response.status === 200) {
        alert("Journey deleted successfully");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error deleting journey:", error);
      alert("Failed to delete journey");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Layout userName={userName}>
      <div className="journey-details">
        <h1>
          Details of {currentTitle}
          {journeyOwner && (
            <span className="journey-author"> by {journeyOwner.userName}</span>
          )}
        </h1>

        {/* Social Actions Bar - For the entire Journey */}
        <div className="social-actions-bar">
          <LikeButton
            targetModel="Journeys"
            targetId={id}
            initialLiked={isLiked}
            initialCount={likesCount}
          />
          <BookmarkButton
            targetModel="Journeys"
            targetId={id}
            initialBookmarked={isBookmarked}
            initialCount={bookmarksCount}
          />
          <div className="comments-indicator">💬 {commentsCount} Comments</div>
        </div>

        {/* Only show edit form if user is owner */}
        {isOwner && (
          <form
            className="journey-update-box"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <input
                className="journey-update-title"
                type="text"
                placeholder="edit your journey title here"
                value={newTitle}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <button onClick={handleUpdateJourney}>Update Journey Title</button>
          </form>
        )}

        <div className="details-container">
          <MapComponent
            apiKey="AIzaSyBvjss2rrxy8HRCt-Yu6dnKRoUpX35wKh8"
            isOwner={isOwner}
          />

          <div className="details-list">
            {details.length > 0 ? (
              details.map((detail, index) => (
                <div key={detail._id} className="detail-item">
                  <div className="detail-content">
                    <h2>Stop {index + 1}</h2>

                    {editingDetailId === detail._id ? (
                      <div className="edit-form">
                        <textarea
                          className="journey-text"
                          name="journalText"
                          value={editForm.journalText}
                          onChange={handleEditFormChange}
                          placeholder="Enter journal text"
                        />
                      </div>
                    ) : (
                      <>
                        <p>
                          <strong>Location:</strong>{" "}
                          {detail.location?.coordinates
                            ? `Latitude: ${detail.location.coordinates[1].toFixed(
                                4
                              )}, Longitude: ${detail.location.coordinates[0].toFixed(
                                4
                              )}`
                            : "Location not available"}
                        </p>

                        <p>
                          <strong>Time:</strong>{" "}
                          {new Date(detail.time).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p>
                          <strong>Journal:</strong>{" "}
                          {detail.journalText || "No journal entry"}
                        </p>

                        {detail.journalPhoto && detail.journalPhoto !== "" && (
                          <>
                            <div className="photo-container">
                              <img
                                src={detail.journalPhoto}
                                alt={`Photo for stop ${index + 1}`}
                                style={{ maxWidth: "200px" }}
                                onClick={() =>
                                  setSelectedImage(detail.journalPhoto)
                                }
                              />
                            </div>

                            {selectedImage && (
                              <div
                                className="modal-overlay"
                                onClick={() => setSelectedImage(null)}
                              >
                                <img
                                  src={selectedImage}
                                  alt="Enlarged view"
                                  className="modal-image"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Social Actions for Each Detail */}
                        <div className="detail-social-actions">
                          <LikeButton
                            targetModel="JourneyDetails"
                            targetId={detail._id}
                            initialLiked={detail.isLiked}
                            initialCount={detail.likesCount || 0}
                            size="small"
                          />
                          <BookmarkButton
                            targetModel="JourneyDetails"
                            targetId={detail._id}
                            initialBookmarked={detail.isBookmarked}
                            initialCount={detail.bookmarksCount || 0}
                            size="small"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Only show edit/delete buttons if user is owner */}
                  {isOwner && (
                    <div className="detail-actions">
                      {editingDetailId === detail._id ? (
                        <>
                          <button
                            className="save-button"
                            onClick={() => handleSaveEdit(detail._id)}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-button"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleStartEdit(detail)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteDetail(detail._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No details added to this journey yet.</p>
            )}
          </div>
        </div>

        {/* Comment Section - For the entire Journey */}
        <CommentSection journeyId={id} />

        <div className="detail-button">
          {/* Only show delete journey button if user is owner */}
          {isOwner && (
            <button
              className="delete-journey-button"
              onClick={handleDeleteJourney}
            >
              Delete Journey
            </button>
          )}
          <button onClick={handleGoBack}>← Back</button>
        </div>
      </div>
    </Layout>
  );
}

export default JourneyDetails;

// components/SocialComponents.js - Fixed version with correct model names
import React, { useState, useEffect } from "react";
import api from "./api";
import "./css/SocialComponents.css";

// ============ LIKE BUTTON COMPONENT ============
export const LikeButton = ({
  targetModel,
  targetId,
  initialLiked = false,
  initialCount = 0,
  size = "medium",
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click events
    if (isLoading) return;

    setIsLoading(true);
    try {
      // FIX: Ensure the model name is correctly capitalized
      const normalizedModel = normalizeModelName(targetModel);
      console.log(
        `Sending like request: /social/like/${normalizedModel}/${targetId}`
      );

      const response = await api.post(
        `/social/like/${normalizedModel}/${targetId}`
      );
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`like-button ${size} ${isLiked ? "liked" : ""} ${
        isLoading ? "loading" : ""
      }`}
      onClick={handleLike}
      disabled={isLoading}
    >
      <span className="like-icon">{isLiked ? "❤️" : "🤍"}</span>
      <span className="like-count">{likesCount}</span>
    </button>
  );
};

// ============ BOOKMARK BUTTON COMPONENT ============
export const BookmarkButton = ({
  targetModel,
  targetId,
  initialBookmarked = false,
  initialCount = 0,
  size = "medium",
}) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarksCount, setBookmarksCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // FIX: Ensure the model name is correctly capitalized
      const normalizedModel = normalizeModelName(targetModel);
      console.log(
        `Sending bookmark request: /social/bookmark/${normalizedModel}/${targetId}`
      );

      const response = await api.post(
        `/social/bookmark/${normalizedModel}/${targetId}`
      );
      setIsBookmarked(response.data.isBookmarked);
      setBookmarksCount(response.data.bookmarksCount);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`bookmark-button ${size} ${isBookmarked ? "bookmarked" : ""} ${
        isLoading ? "loading" : ""
      }`}
      onClick={handleBookmark}
      disabled={isLoading}
    >
      <span className="bookmark-icon">{isBookmarked ? "🔖" : "📑"}</span>
      <span className="bookmark-count">{bookmarksCount}</span>
    </button>
  );
};

// ============ HELPER FUNCTION TO NORMALIZE MODEL NAMES ============
// This ensures model names match what the backend expects
const normalizeModelName = (model) => {
  const modelMap = {
    journeys: "Journeys",
    journey: "Journeys",
    Journey: "Journeys",
    Journeys: "Journeys",
    journeydetails: "JourneyDetails",
    journeyDetails: "JourneyDetails",
    JourneyDetails: "JourneyDetails",
    comments: "Comments",
    comment: "Comments",
    Comment: "Comments",
    Comments: "Comments",
  };

  return modelMap[model] || model;
};

// ============ COMMENT SECTION COMPONENT ============
export const CommentSection = ({ journeyId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, page]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(
        `/social/comments/journey/${journeyId}?page=${page}`
      );
      if (page === 1) {
        setComments(response.data.comments);
      } else {
        setComments((prev) => [...prev, ...response.data.comments]);
      }
      setHasMore(response.data.hasMore);
      setTotalComments(response.data.totalComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/social/comments/journey/${journeyId}`, {
        content: newComment,
      });
      setComments((prev) => [response.data.comment, ...prev]);
      setNewComment("");
      setTotalComments((prev) => prev + 1);
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    }
  };

  const handleSubmitReply = async (e, parentCommentId, replyToUserId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const response = await api.post(`/social/comments/journey/${journeyId}`, {
        content: replyText,
        parentCommentId,
        replyToUserId,
      });

      // Add reply to the parent comment's replies array
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data.comment],
              repliesCount: (comment.repliesCount || 0) + 1,
            };
          }
          return comment;
        })
      );

      setReplyingTo(null);
      setReplyText("");
      setTotalComments((prev) => prev + 1);
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
    }
  };

  const handleDeleteComment = async (
    commentId,
    isReply = false,
    parentId = null
  ) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await api.delete(`/social/comments/${commentId}`);

      if (isReply && parentId) {
        // Remove reply from parent comment
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === parentId) {
              return {
                ...comment,
                replies: comment.replies.filter((r) => r._id !== commentId),
                repliesCount: Math.max(0, (comment.repliesCount || 0) - 1),
              };
            }
            return comment;
          })
        );
        setTotalComments((prev) => prev - 1);
      } else {
        // Remove main comment and count its replies
        const deletedComment = comments.find((c) => c._id === commentId);
        const repliesCount = deletedComment?.replies?.length || 0;
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setTotalComments((prev) => prev - 1 - repliesCount);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get current user from cookies instead of localStorage for consistency
  const getCurrentUser = () => {
    const userCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="));
    if (userCookie) {
      try {
        return JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
      } catch (e) {
        console.error("Error parsing user cookie:", e);
      }
    }
    return {};
  };

  return (
    <div className="comment-section">
      {/* Comments Header */}
      <div className="comments-header">
        <h3
          onClick={() => setShowComments(!showComments)}
          style={{ cursor: "pointer" }}
        >
          💬 Comments ({totalComments})
          <span className="toggle-icon">{showComments ? " ▼" : " ▶"}</span>
        </h3>
      </div>

      {showComments && (
        <>
          {/* New Comment Form */}
          <form className="new-comment-form" onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this journey..."
              className="comment-input"
              rows="3"
            />
            <button type="submit" className="submit-comment-btn">
              Post Comment
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {isLoading && page === 1 ? (
              <div className="loading">Loading comments...</div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  onReply={(replyToUserId) => {
                    setReplyingTo(comment._id);
                    setReplyText(
                      replyToUserId ? `@${comment.userId.userName} ` : ""
                    );
                  }}
                  onDelete={handleDeleteComment}
                  formatTimeAgo={formatTimeAgo}
                  isReplying={replyingTo === comment._id}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onSubmitReply={(e) =>
                    handleSubmitReply(e, comment._id, comment.userId._id)
                  }
                  onCancelReply={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  getCurrentUser={getCurrentUser}
                />
              ))
            ) : (
              <div className="no-comments">
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && (
              <button
                className="load-more-btn"
                onClick={() => setPage((prev) => prev + 1)}
              >
                Load More Comments
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============ COMMENT ITEM COMPONENT ============
const CommentItem = ({
  comment,
  onReply,
  onDelete,
  formatTimeAgo,
  isReplying,
  replyText,
  setReplyText,
  onSubmitReply,
  onCancelReply,
  getCurrentUser,
}) => {
  const currentUser = getCurrentUser();
  const isOwner = currentUser.id === comment.userId._id;

  return (
    <div className="comment-item">
      <div className="comment-header">
        <img
          src={
            comment.userId.profilePicture || "https://via.placeholder.com/40"
          }
          alt={comment.userId.userName}
          className="comment-avatar"
        />
        <div className="comment-info">
          <span className="comment-author">{comment.userId.userName}</span>
          <span className="comment-time">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
      </div>

      <div className="comment-body">
        <p className="comment-text">{comment.content}</p>

        <div className="comment-actions">
          <LikeButton
            targetModel="Comments"
            targetId={comment._id}
            initialLiked={comment.isLiked}
            initialCount={comment.likesCount}
            size="small"
          />
          <button
            className="reply-btn"
            onClick={() => onReply(comment.userId._id)}
          >
            Reply
          </button>
          {isOwner && (
            <button
              className="delete-btn"
              onClick={() => onDelete(comment._id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <form className="reply-form" onSubmit={onSubmitReply}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="reply-input"
            rows="2"
            autoFocus
          />
          <div className="reply-form-actions">
            <button type="submit" className="submit-reply-btn">
              Reply
            </button>
            <button
              type="button"
              className="cancel-reply-btn"
              onClick={onCancelReply}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <div key={reply._id} className="reply-item">
              <div className="reply-header">
                <img
                  src={
                    reply.userId.profilePicture ||
                    "https://via.placeholder.com/32"
                  }
                  alt={reply.userId.userName}
                  className="reply-avatar"
                />
                <div className="reply-info">
                  <span className="reply-author">{reply.userId.userName}</span>
                  {reply.replyToUser && (
                    <span className="reply-to">
                      ▶ {reply.replyToUser.userName}
                    </span>
                  )}
                  <span className="reply-time">
                    {formatTimeAgo(reply.createdAt)}
                  </span>
                </div>
              </div>

              <p className="reply-text">{reply.content}</p>

              <div className="reply-actions">
                <LikeButton
                  targetModel="Comments"
                  targetId={reply._id}
                  initialLiked={reply.isLiked}
                  initialCount={reply.likesCount}
                  size="small"
                />

                {/* Add Reply button for replies */}
                <button
                  className="reply-btn"
                  onClick={() => onReply(reply.userId._id)}
                >
                  Reply
                </button>

                {/* Delete button only shows for reply owner */}
                {currentUser.id === reply.userId._id && (
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(reply._id, true, comment._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

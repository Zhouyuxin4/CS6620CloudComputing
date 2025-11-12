// routes/socialRoutes.js
const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");
const { authenticateToken } = require("../middleware/authMiddleware");

// ============ LIKES ROUTES ============
// Toggle like (works for Journeys, JourneyDetails, and Comments)
router.post(
  "/like/:targetModel/:targetId",
  authenticateToken,
  socialController.toggleLike
);

// Get list of users who liked something
router.get(
  "/likes/:targetModel/:targetId",
  authenticateToken,
  socialController.getLikes
);

// ============ BOOKMARKS ROUTES ============
// Toggle bookmark (works for Journeys and JourneyDetails)
router.post(
  "/bookmark/:targetModel/:targetId",
  authenticateToken,
  socialController.toggleBookmark
);

// Get user's bookmarked items (can filter by type using query param)
// Examples:
// GET /api/social/bookmarks - Get all bookmarks
// GET /api/social/bookmarks?type=Journeys - Get only journey bookmarks
// GET /api/social/bookmarks?type=JourneyDetails - Get only detail bookmarks
router.get("/bookmarks", authenticateToken, socialController.getUserBookmarks);
router.get(
  "/bookmarks/:userId",
  authenticateToken,
  socialController.getUserBookmarks
);

// ============ COMMENTS ROUTES ============
// Create comment or reply on a journey
router.post(
  "/comments/journey/:journeyId",
  authenticateToken,
  socialController.createComment
);

// Get comments for a journey
router.get(
  "/comments/journey/:journeyId",
  authenticateToken,
  socialController.getComments
);

// Delete a comment
router.delete(
  "/comments/:commentId",
  authenticateToken,
  socialController.deleteComment
);

module.exports = router;

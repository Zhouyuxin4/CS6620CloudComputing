const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Search users
router.get("/search/:keyword", authenticateToken, friendController.searchUsers);

// Follow functionality
router.post("/follow/:userId", authenticateToken, friendController.followUser);
router.delete("/unfollow/:userId", authenticateToken, friendController.unfollowUser);
router.get("/following/journeys", authenticateToken, friendController.getFollowingJourneys); // More specific route first
router.get("/following", authenticateToken, friendController.getFollowingList);
router.get("/followers", authenticateToken, friendController.getFollowersList);

// Legacy friend functionality (for backwards compatibility)
router.post("/add/:friendId", authenticateToken, friendController.addFriend);
router.get("/list", authenticateToken, friendController.getFriendsList);

module.exports = router;

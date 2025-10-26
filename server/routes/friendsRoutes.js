const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/search/:keyword", authenticateToken, friendController.searchUsers);
router.post("/add/:friendId", authenticateToken, friendController.addFriend);
router.get("/list", authenticateToken, friendController.getFriendsList);

module.exports = router;

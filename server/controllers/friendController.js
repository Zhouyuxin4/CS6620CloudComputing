const Users = require("../models/Users");
const Journeys = require("../models/Journeys");

// Search users by keyword
exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const currentUserId = req.user.userId;
    
    const users = await Users.find({
      userName: { $regex: keyword, $options: "i" },
      _id: { $ne: currentUserId }, // Exclude current user
    }).select("userName profilePicture");
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetUserId = req.params.userId;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Add to current user's following list
    await Users.findByIdAndUpdate(userId, {
      $addToSet: { following: targetUserId },
    });
    
    // Add to target user's followers list
    await Users.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: userId },
    });

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetUserId = req.params.userId;

    // Remove from current user's following list
    await Users.findByIdAndUpdate(userId, {
      $pull: { following: targetUserId },
    });
    
    // Remove from target user's followers list
    await Users.findByIdAndUpdate(targetUserId, {
      $pull: { followers: userId },
    });

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get list of users that current user is following
exports.getFollowingList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await Users.findById(userId).populate(
      "following",
      "userName profilePicture"
    );
    res.status(200).json(user.following || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get list of users following the current user
exports.getFollowersList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await Users.findById(userId).populate(
      "followers",
      "userName profilePicture"
    );
    res.status(200).json(user.followers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all journeys from users that current user is following (sorted by time)
exports.getFollowingJourneys = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get list of users that current user is following
    const user = await Users.findById(userId).select("following");
    
    if (!user || !user.following || user.following.length === 0) {
      return res.status(200).json([]);
    }

    // Get all journeys from followed users, sorted by creation time
    const journeys = await Journeys.find({
      userName: { $in: user.following },
    })
      .populate("userName", "userName profilePicture")
      .sort({ createdAt: -1 }); // Sort by creation time (newest first)

    res.status(200).json(journeys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy friend functionality (for backwards compatibility)
exports.addFriend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    await Users.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendId },
    });
    await Users.findByIdAndUpdate(friendId, {
      $addToSet: { friends: userId },
    });

    res.status(200).json({ message: "Friend added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriendsList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await Users.findById(userId).populate(
      "friends",
      "userName profilePicture"
    );
    res.status(200).json(user.friends || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

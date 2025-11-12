// controllers/journeyController.js - Complete fixed version
const Journeys = require("../models/Journeys.js");
const Users = require("../models/Users.js");
const Likes = require("../models/Likes.js");
const Bookmarks = require("../models/Bookmarks.js");

// Helper function to attach social data
async function attachSocialData(journeys, userId) {
  if (!userId) return journeys;

  const journeyIds = journeys.map((j) => j._id);

  // Get user's likes
  const userLikes = await Likes.find({
    userId,
    targetId: { $in: journeyIds },
    targetModel: "Journeys",
  });
  const likedIds = new Set(userLikes.map((l) => l.targetId.toString()));

  // Get user's bookmarks
  const userBookmarks = await Bookmarks.find({
    userId,
    targetId: { $in: journeyIds },
    targetModel: "Journeys",
  });
  const bookmarkedIds = new Set(
    userBookmarks.map((b) => b.targetId.toString())
  );

  // Attach flags to journeys
  return journeys.map((journey) => {
    const journeyObj = journey.toObject ? journey.toObject() : journey;
    journeyObj.isLiked = likedIds.has(journeyObj._id.toString());
    journeyObj.isBookmarked = bookmarkedIds.has(journeyObj._id.toString());
    return journeyObj;
  });
}

// Get a user's all journeys - FIXED VERSION
exports.getAllJourneys = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const requestedUserName = req.params.userName;

    console.log("🔍 Getting journeys for userName:", requestedUserName);
    console.log("Current logged-in userId:", userId);

    // Find the user by userName
    const user = await Users.findOne({ userName: requestedUserName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Found user:", user.userName, "with _id:", user._id);

    // Check if viewing own profile
    const isOwnProfile = userId && user._id.toString() === userId;
    console.log("Is viewing own profile:", isOwnProfile);

    // Build query - userName field in Journeys references the user's _id
    const query = { userName: user._id };

    // Only show public journeys if not own profile
    if (!isOwnProfile) {
      query.isPublic = true;
      console.log("Adding isPublic filter for non-owner");
    }

    console.log("Query being used:", JSON.stringify(query));

    // Find journeys
    let journeys = await Journeys.find(query)
      .populate("userName", "userName profilePicture")
      .sort({ createdAt: -1 });

    console.log("Found", journeys.length, "journeys");

    // Attach social data
    journeys = await attachSocialData(journeys, userId);

    res.status(200).json({
      journeys,
      totalJourneys: journeys.length,
      isOwnProfile,
    });
  } catch (error) {
    console.error("❌ Error in getAllJourneys:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create Journey - FIXED VERSION
exports.createJourney = async (req, res) => {
  try {
    const requestedUserName = req.params.userName;
    const currentUserId = req.user?.userId;

    console.log("📝 Creating journey for userName:", requestedUserName);
    console.log("Current logged-in userId:", currentUserId);

    // Find the user by userName
    const user = await Users.findOne({ userName: requestedUserName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Found user:", user.userName, "with _id:", user._id);

    // Verify the logged-in user is creating for themselves
    if (!currentUserId || user._id.toString() !== currentUserId) {
      return res.status(403).json({
        message: "You can only create journeys for your own account",
      });
    }

    // Prepare journey data
    const journeyData = {
      ...req.body,
      userName: user._id, // Set the userName field to user's _id
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
    };

    console.log("Journey data to save:", {
      title: journeyData.title,
      userName: journeyData.userName,
      isPublic: journeyData.isPublic,
    });

    // Create and save the journey
    const journey = new Journeys(journeyData);
    const newJourney = await journey.save();

    console.log("✅ Journey saved with _id:", newJourney._id);
    console.log("Journey userName field value:", newJourney.userName);

    // Add journey reference to user's journeys array
    user.journeys.push(newJourney._id);
    await user.save();

    console.log("✅ Added journey to user's journeys array");

    // Populate user info before sending response
    const populatedJourney = await Journeys.findById(newJourney._id).populate(
      "userName",
      "userName profilePicture"
    );

    console.log("✅ Journey created successfully");
    res.status(201).json(populatedJourney);
  } catch (error) {
    console.error("❌ Error creating journey:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Journey by ID
exports.getJourneyId = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const journeyId = req.params.journeyId;

    console.log("🔍 [getJourneyId] Start:", { journeyId, userId });

    // Check if journeyId is valid
    if (!journeyId || journeyId === "undefined") {
      console.error("❌ Invalid journeyId:", journeyId);
      return res.status(400).json({ message: "Invalid journey ID" });
    }

    let journey = await Journeys.findById(journeyId)
      .populate("userName", "userName profilePicture followers")
      .populate({
        path: "details",
        options: { sort: { time: 1 } },
      });

    if (!journey) {
      console.log("❌ Journey not found:", journeyId);
      return res.status(404).json({ message: "Journey not found." });
    }

    console.log("✅ Journey found:", journey.title);

    const isOwner = userId && journey.userName._id.toString() === userId;
    if (!journey.isPublic && !isOwner) {
      console.log("🔒 Journey is private");
      return res.status(403).json({ message: "This journey is private." });
    }

    console.log("🔍 Attaching social data");
    const journeyWithSocial = await attachSocialData([journey], userId);

    let isFollowing = false;
    if (userId && journey.userName.followers) {
      isFollowing = journey.userName.followers.some(
        (f) => f.toString() === userId
      );
    }

    console.log("✅ Sending journey response");
    res.status(200).json({
      journey: journeyWithSocial[0],
      isOwner,
      isFollowing,
    });
  } catch (error) {
    console.error("❌ [getJourneyId] Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Update Journey
exports.updateJourney = async (req, res) => {
  try {
    const userId = req.user.userId;
    const journeyId = req.params.journeyId;

    const journey = await Journeys.findById(journeyId);
    if (!journey) {
      return res.status(404).json({ message: "Journey not found." });
    }

    // Check ownership
    if (journey.userName.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own journeys." });
    }

    const allowedUpdates = ["title", "isPublic", "coverImage"];
    const updatedData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });

    const updatedJourney = await Journeys.findByIdAndUpdate(
      journeyId,
      updatedData,
      { new: true }
    ).populate("userName", "userName profilePicture");

    res.status(200).json(updatedJourney);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Journey
exports.deleteJourney = async (req, res) => {
  const userId = req.user.userId;
  const journeyId = req.params.journeyId;

  try {
    // First find the journey to check ownership
    const journey = await Journeys.findById(journeyId);
    if (!journey) {
      return res.status(404).json({ message: "Journey not found." });
    }

    // Check if user owns this journey
    if (journey.userName.toString() !== userId) {
      return res.status(403).json({
        message: "You can only delete your own journeys.",
      });
    }

    // Delete the journey
    await Journeys.findByIdAndDelete(journeyId);

    // Clean up related data
    await Likes.deleteMany({
      targetId: journeyId,
      targetModel: "Journeys",
    });

    await Bookmarks.deleteMany({
      targetId: journeyId,
      targetModel: "Journeys",
    });

    const Comments = require("../models/Comments");
    await Comments.deleteMany({
      journeyId: journeyId,
    });

    // Remove from user's journeys array
    await Users.findByIdAndUpdate(
      userId,
      { $pull: { journeys: journeyId } },
      { new: true }
    );

    res.status(200).json({ message: "Journey deleted successfully." });
  } catch (error) {
    console.error("Delete journey error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get feed of journeys from followed users
exports.getFeedJourneys = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let journeys = await Journeys.find({
      userName: { $in: user.following },
      isPublic: true,
    })
      .populate("userName", "userName profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalJourneys = await Journeys.countDocuments({
      userName: { $in: user.following },
      isPublic: true,
    });

    journeys = await attachSocialData(journeys, userId);

    res.status(200).json({
      journeys,
      totalJourneys,
      currentPage: page,
      totalPages: Math.ceil(totalJourneys / limit),
      hasMore: page < Math.ceil(totalJourneys / limit),
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get trending/popular journeys
exports.getTrendingJourneys = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || "week";

    let dateThreshold = new Date();
    switch (timeframe) {
      case "week":
        dateThreshold.setDate(dateThreshold.getDate() - 7);
        break;
      case "month":
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
      case "all":
        dateThreshold = new Date(0);
        break;
    }

    let journeys = await Journeys.find({
      isPublic: true,
      createdAt: { $gte: dateThreshold },
    })
      .populate("userName", "userName profilePicture")
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalJourneys = await Journeys.countDocuments({
      isPublic: true,
      createdAt: { $gte: dateThreshold },
    });

    journeys = await attachSocialData(journeys, userId);

    res.status(200).json({
      journeys,
      totalJourneys,
      currentPage: page,
      totalPages: Math.ceil(totalJourneys / limit),
      hasMore: page < Math.ceil(totalJourneys / limit),
      timeframe,
    });
  } catch (error) {
    console.error("Get trending error:", error);
    res.status(500).json({ message: error.message });
  }
};

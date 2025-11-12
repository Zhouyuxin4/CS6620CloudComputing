// controllers/journeyDetailController.js
const JourneyDetails = require("../models/JourneyDetails.js");
const Journeys = require("../models/Journeys.js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to attach social data to details
async function attachSocialDataToDetails(details, userId) {
  if (!userId || !details || details.length === 0) return details;

  const Likes = require("../models/Likes");
  const Bookmarks = require("../models/Bookmarks");

  const detailIds = details.map((d) => d._id);

  const userLikes = await Likes.find({
    userId,
    targetId: { $in: detailIds },
    targetModel: "JourneyDetails",
  });
  const likedIds = new Set(userLikes.map((l) => l.targetId.toString()));

  const userBookmarks = await Bookmarks.find({
    userId,
    targetId: { $in: detailIds },
    targetModel: "JourneyDetails",
  });
  const bookmarkedIds = new Set(
    userBookmarks.map((b) => b.targetId.toString())
  );

  return details.map((detail) => {
    const detailObj = detail.toObject ? detail.toObject() : detail;
    detailObj.isLiked = likedIds.has(detailObj._id.toString());
    detailObj.isBookmarked = bookmarkedIds.has(detailObj._id.toString());
    return detailObj;
  });
}

// controllers/journeyDetailController.js
exports.getDetailsByJourneyId = async (req, res) => {
  try {
    const journeyId = req.params.journeyId;
    const userId = req.user?.userId;

    console.log("🔍 [getDetailsByJourneyId] Start:", { journeyId, userId });

    // 检查 journeyId 是否有效
    if (!journeyId || journeyId === "undefined") {
      console.error("❌ Invalid journeyId:", journeyId);
      return res.status(400).json({ message: "Invalid journey ID" });
    }

    let details = await JourneyDetails.find({ journeyId })
      .select(
        "time location journalText journalPhoto likesCount bookmarksCount"
      )
      .sort({ time: 1 });

    console.log("📊 Details found:", details.length);

    if (userId) {
      console.log("🔐 Attaching social data for user:", userId);
      details = await attachSocialDataToDetails(details, userId);
    }

    console.log("✅ Sending response with", details.length, "details");
    res.status(200).json(details);
  } catch (error) {
    console.error("❌ [getDetailsByJourneyId] Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get detail by ID
exports.getDetailId = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    const userId = req.user?.userId;

    let detail = await JourneyDetails.findById(detailId);

    if (!detail) {
      return res.status(404).json({ message: "Journey detail not found" });
    }

    if (userId) {
      const detailsWithSocial = await attachSocialDataToDetails(
        [detail],
        userId
      );
      detail = detailsWithSocial[0];
    }

    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new detail
exports.createDetail = async (req, res) => {
  try {
    const { time, location, journalText, journeyId } = req.body;
    const journalPhoto = req.file;
    let journalPhotoUrl = null;

    if (journalPhoto) {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const key = `${Date.now()}-${journalPhoto.originalname}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: journalPhoto.buffer,
        ContentType: journalPhoto.mimetype,
      });
      await s3Client.send(command);
      journalPhotoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const newDetail = new JourneyDetails({
      time,
      location: JSON.parse(location),
      journalText,
      journeyId,
      journalPhoto: journalPhotoUrl,
    });

    await newDetail.save();

    await Journeys.findByIdAndUpdate(
      journeyId,
      { $push: { details: newDetail._id } },
      { new: true }
    );

    res.status(201).json(newDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a detail
exports.deleteDetail = async (req, res) => {
  try {
    const { detailId } = req.params;

    const detail = await JourneyDetails.findByIdAndDelete(detailId);
    if (!detail) {
      return res.status(404).json({ message: "Journey Detail not found." });
    }

    const updatedJourney = await Journeys.findByIdAndUpdate(
      detail.journeyId,
      { $pull: { details: detailId } },
      { new: true }
    );

    if (!updatedJourney) {
      return res.status(404).json({ message: "Journey update failed." });
    }

    res.status(200).json({ message: "Journey Detail deleted successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update a detail
exports.updateDetail = async (req, res) => {
  try {
    const id = req.params.detailId;
    const updatedData = req.body;

    const updatedDetail = await JourneyDetails.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedDetail) {
      return res.status(404).json({ message: "Journey detail not found." });
    }

    res.status(200).json(updatedDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

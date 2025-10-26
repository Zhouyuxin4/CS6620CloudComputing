const Users = require("../models/Users");

exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const users = await Users.find({
      userName: { $regex: keyword, $options: "i" },
    }).select("userName profilePicture");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

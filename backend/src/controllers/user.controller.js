import userModel from "../models/user.model.js";

/**
 * GET USER PROFILE
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({
      message: "Failed to get user profile",
    });
  }
};

/**
 * UPDATE PROFILE
 */
export const updateProfile = async (req, res) => {
  try {
    const { bio, skills, profilePic } = req.body;

    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        bio,
        skills,
        profilePic,
      },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    if (!currentUser.following.includes(req.params.id)) {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);

      await currentUser.save();
      await userToFollow.save();
    }

    res.json({ message: "User followed" });
  } catch (error) {
    console.error("FOLLOW ERROR:", error);
    res.status(500).json({ message: "Follow failed" });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user.id
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: "User unfollowed" });
  } catch (error) {
    console.error("UNFOLLOW ERROR:", error);
    res.status(500).json({ message: "Unfollow failed" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } }
      ]
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
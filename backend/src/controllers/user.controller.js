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
      return res.status(404).json({ message: "User not found" });
    }

    // Wrap in { user } so frontend can access res.data.user
    res.json({ user });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Failed to get user profile" });
  }
};

/**
 * UPDATE PROFILE
 */
export const updateProfile = async (req, res) => {
  try {
    const { bio, skills, profilePic } = req.body;

    const user = await userModel
      .findByIdAndUpdate(
        req.user.id,
        { bio, skills, profilePic },
        { new: true }
      )
      .select("-password");

    res.json({ user });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * FOLLOW USER
 */
export const followUser = async (req, res) => {
  try {
    const userToFollow = await userModel.findById(req.params.id);
    const currentUser = await userModel.findById(req.user.id);

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

/**
 * UNFOLLOW USER
 */
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await userModel.findById(req.params.id);
    const currentUser = await userModel.findById(req.user.id);

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

/**
 * SEARCH USERS
 */
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query || "";

    const filter = query
      ? {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { skills: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const users = await userModel.find(filter).select("-password").limit(20);

    res.json({ users });
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * GET CONNECTIONS (followers + following union)
 */
export const getConnections = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .populate("followers", "username profilePic bio")
      .populate("following", "username profilePic bio");

    // Merge followers and following, remove duplicates by _id
    const seen = new Set();
    const connections = [];

    for (const u of [...user.followers, ...user.following]) {
      if (!seen.has(u._id.toString())) {
        seen.add(u._id.toString());
        connections.push(u);
      }
    }

    res.json({ users: connections });
  } catch (error) {
    console.error("CONNECTIONS ERROR:", error);
    res.status(500).json({ message: "Failed to get connections" });
  }
};
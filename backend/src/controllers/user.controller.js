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
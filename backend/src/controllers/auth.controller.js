import userModel from "../models/user.model.js";
import Session from "../models/session.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * Generate Tokens
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * REGISTER USER
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // ✅ create session
    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * LOGIN USER
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // ✅ store in session (IMPORTANT)
    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * GET CURRENT USER
 */
export const getMe = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * REFRESH ACCESS TOKEN
 */
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      config.REFRESH_TOKEN_SECRET
    );

    const session = await Session.findOne({
      userId: decoded.id,
      refreshToken,
    });

    if (!session) {
      return res.status(403).json({ message: "Invalid session" });
    }

    const newAccessToken = generateAccessToken(decoded.id);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

/**
 * LOGOUT (Single Device)
 */
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token required",
    });
  }

  await Session.deleteOne({ refreshToken });

  res.json({
    message: "Logged out from this device",
  });
};

/**
 * LOGOUT ALL DEVICES
 */
export const logoutAll = async (req, res) => {
  await Session.deleteMany({ userId: req.user.id });

  res.json({
    message: "Logged out from all devices",
  });
};
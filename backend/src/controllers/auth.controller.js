import userModel from "../models/user.model.js";
import Session from "../models/session.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { sendEmail } from "../utils/sendMail.js";

/**
 * TEMP OTP STORE (in-memory)
 */
const otpStore = new Map();

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
 * Generate OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * REGISTER (SEND OTP ONLY - NO DB SAVE)
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ❌ if already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists, please login",
      });
    }

    const otp = generateOTP();

    // store temporarily
    otpStore.set(email, {
      username,
      email,
      password,
      otp,
      expiry: Date.now() + 5 * 60 * 1000, // 5 min
    });

    // send email
    await sendEmail(
      email,
      "OTP Verification",
      `Your OTP is ${otp}`
    );

    console.log("OTP SENT:", otp); // debug

    res.json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * VERIFY OTP → CREATE USER
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const data = otpStore.get(email);

    if (!data) {
      return res.status(400).json({
        message: "No OTP found, please register again",
      });
    }

    const cleanOtp = otp.toString().trim();

    console.log("Expected OTP:", data.otp);
    console.log("Entered OTP:", cleanOtp);

    // ❌ expired
    if (data.expiry < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({
        message: "OTP expired, register again",
      });
    }

    // ❌ invalid
    if (data.otp !== cleanOtp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ✅ create user now
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userModel.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      isVerified: true,
    });

    // remove temp data
    otpStore.delete(email);

    res.json({
      message: "Account created successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * LOGIN
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

    // create session
    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json({
      message: "Login successful",
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

    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * REFRESH TOKEN
 */
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: "No refresh token",
    });
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
      return res.status(403).json({
        message: "Invalid session",
      });
    }

    const accessToken = generateAccessToken(decoded.id);

    res.json({
      accessToken,
    });
  } catch (error) {
    res.status(403).json({
      message: "Invalid refresh token",
    });
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
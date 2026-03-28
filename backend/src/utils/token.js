import jwt from "jsonwebtoken";
import config from "../config/config.js";

// Access Token (short life)
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

// Refresh Token (long life)
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
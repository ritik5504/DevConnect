import jwt from "jsonwebtoken";
import config from "../config/config.js";



export const protect = (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // No token
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token failed or expired" });
  }
  
};
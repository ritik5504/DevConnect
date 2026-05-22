import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/call/ice-servers
// Returns ICE server configuration for WebRTC peer connections.
// If METERED_API_KEY + METERED_APP_NAME are set in .env, fetches fresh
// time-limited credentials from Metered.ca (most reliable).
// Falls back to multiple hardcoded public TURN servers otherwise.
router.get("/ice-servers", protect, async (req, res) => {
  try {
    const iceServers = [
      // ── STUN servers (always included) ──────────────────────────────────
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.relay.metered.ca:80" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ];

    // ── Metered.ca dynamic credentials (most reliable, free account needed) ─
    const meteredApiKey  = process.env.METERED_API_KEY;
    const meteredAppName = process.env.METERED_APP_NAME;

    if (meteredApiKey && meteredAppName) {
      console.log(`[ICE] Metered.ca environment variables found. Attempting to fetch credentials for app: ${meteredAppName}`);
      try {
        const url = `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const credentials = await response.json();
          iceServers.push(...credentials);
          console.log("[ICE] Successfully fetched fresh Metered.ca TURN credentials");
          return res.json({ iceServers });
        } else {
          console.warn("[ICE] Metered.ca credentials fetch API returned non-OK status:", response.status);
        }
      } catch (err) {
        console.error("[ICE] Metered.ca credentials fetch encountered an error:", err.message);
      }
    } else {
      console.log("[ICE] Metered.ca environment variables (METERED_API_KEY and/or METERED_APP_NAME) are missing. Falling back to public TURN servers.");
    }

    // ── Fallback: hardcoded public TURN servers ──────────────────────────
    // Multiple servers so if one is down, others handle the relay.
    iceServers.push(
      // freeturn.net – reliable free public TURN relay
      {
        urls: "turn:freeturn.net:3478",
        username: "free",
        credential: "free",
      },
      {
        urls: "turns:freeturn.net:5349",
        username: "free",
        credential: "free",
      },
      // Metered.ca open relay (public, no auth needed)
      {
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
          "turns:openrelay.metered.ca:443?transport=tcp",
        ],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      // numb.viagenie.ca – additional backup
      {
        urls: "turn:numb.viagenie.ca",
        username: "webrtc@live.com",
        credential: "muazkh",
      }
    );

    console.log("[ICE] Returning fallback ICE servers");
    return res.json({ iceServers });
  } catch (error) {
    console.error("[ICE] Unexpected error:", error.message);
    return res.status(500).json({ message: "Failed to get ICE servers" });
  }
});

// GET /api/call/debug-turn
// A public helper route to check environmental configuration and test Metered.ca API connectivity.
router.get("/debug-turn", async (req, res) => {
  const meteredApiKey = process.env.METERED_API_KEY;
  const meteredAppName = process.env.METERED_APP_NAME;

  const debugInfo = {
    METERED_APP_NAME: {
      exists: !!meteredAppName,
      value: meteredAppName || null,
      hasDotMeteredLive: meteredAppName ? meteredAppName.includes(".metered.live") : false,
    },
    METERED_API_KEY: {
      exists: !!meteredApiKey,
      length: meteredApiKey ? meteredApiKey.length : 0,
      masked: meteredApiKey ? `${meteredApiKey.slice(0, 3)}...${meteredApiKey.slice(-3)}` : null,
      looksLikePlaceholder: meteredApiKey ? (meteredApiKey.includes("<") || meteredApiKey.includes("paste")) : false,
    },
    apiCall: {
      success: false,
      status: null,
      statusText: null,
      error: null,
      responseSample: null,
    }
  };

  if (meteredApiKey && meteredAppName) {
    try {
      const url = `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`;
      const response = await fetch(url);
      debugInfo.apiCall.status = response.status;
      debugInfo.apiCall.statusText = response.statusText;
      if (response.ok) {
        const credentials = await response.json();
        debugInfo.apiCall.success = true;
        debugInfo.apiCall.responseSample = credentials;
      } else {
        const text = await response.text();
        debugInfo.apiCall.error = text;
      }
    } catch (err) {
      debugInfo.apiCall.error = err.message;
    }
  }

  return res.json(debugInfo);
});

export default router;


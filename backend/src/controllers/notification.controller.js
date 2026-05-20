import Notification from "../models/notification.model.js";

/**
 * GET /api/notification
 * Returns all notifications for the logged-in user (recipient = me)
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * PUT /api/notification/read
 * Marks all notifications as read for the logged-in user
 */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

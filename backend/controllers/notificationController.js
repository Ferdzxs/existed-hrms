import { db } from "../config/db.js";

// Assumes PostgreSQL functions:
//   get_notification_all(), get_notification_by_user_id(user_id uuid),
//   get_notification_by_id(notification_id uuid),
//   update_notification_status(notification_id uuid, status text),
//   delete_notification_by_id(notification_id uuid),
//   get_unread_notification_count(user_id uuid)

export const fetchNotificationsAll = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM get_notification_all()");

    console.log("Notifications fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchNotificationByUserId = async (req, res) => {
  const { u_id } = req.user;

  try {
    const { rows } = await db.query(
      "SELECT * FROM get_notification_by_user_id($1)",
      [u_id]
    );

    console.log("Notifications fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchNotificationByNotificationId = async (req, res) => {
  if (!req.params.notificationId) {
    return res.status(400).send("Notification ID is required");
  }

  const { notificationId } = req.params;

  try {
    const { rows } = await db.query(
      "SELECT * FROM get_notification_by_id($1)",
      [notificationId]
    );

    console.log("Notification fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching notification:", err);
    return res.status(500).send("Server error");
  }
};

export const updateNotificationStatus = async (req, res) => {
  const { notificationId, status } = req.body;

  if (!notificationId || !status) {
    return res.status(400).send("Notification ID and status are required");
  }

  if (status !== "read" && status !== "unread") {
    return res
      .status(400)
      .send("Invalid status. Only 'read' or 'unread' is allowed");
  }

  try {
    await db.query("SELECT update_notification_status($1, $2)", [
      notificationId,
      status,
    ]);

    console.log("Notification status updated");

    return res.json({ message: "Notification status updated" });
  } catch (err) {
    console.error("Error updating notification status:", err);
    return res.status(500).send("Server error");
  }
};

export const deleteNotification = async (req, res) => {
  if (!req.params.id) {
    return res.status(400).send("Notification ID is required");
  }

  const { id } = req.params;

  try {
    await db.query("SELECT delete_notification_by_id($1)", [id]);

    console.log("Notification deleted");

    return res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    return res.status(500).send("Server error");
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  const { u_id } = req.user;

  console.log("u_id is ", u_id);

  try {
    const { rows } = await db.query(
      "SELECT get_unread_notification_count($1) AS unreadcount",
      [u_id]
    );

    if (!rows || rows.length === 0) {
      return res.json({ unreadCount: 0 });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching notifications count:", err);
    return res.status(500).send("Server error");
  }
};
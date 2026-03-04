import { db } from "../config/db.js";

// Assumes PostgreSQL function:
//   insert_inquiry(name text, email text, subject text,
//                  description text, type text, reply_status boolean)

export const setSupport = async (req, res) => {
  const { name, email, subject, description, type, reply_status } = req.body;
  console.log("Support inquiry body:", req.body);

  try {
    await db.query("SELECT insert_inquiry($1, $2, $3, $4, $5, $6)", [
      name,
      email,
      subject,
      description,
      type,
      reply_status,
    ]);

    return res.status(200).send("Inquiry submitted successfully");
  } catch (err) {
    console.error("Error during stored procedure call:", err);
    return res.status(500).send("Server error");
  }
};

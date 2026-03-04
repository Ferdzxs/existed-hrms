import { db } from "../config/db.js";

// Assumes PostgreSQL function:
//   get_profile(employee_id uuid) RETURNS jsonb or a row

export const getProfile = async (req, res) => {
  const { e_id } = req.user;

  try {
    const { rows } = await db.query("SELECT * FROM get_profile($1)", [e_id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send("Profile not found");
    }

    const profileData = rows[0].profile || rows[0];

    console.log(profileData);
    return res.status(200).json(profileData);
  } catch (err) {
    console.error("Error fetching profile data:", err);
    return res.status(500).send("Server error");
  }
};

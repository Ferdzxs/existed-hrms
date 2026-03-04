import { db } from "../config/db.js";

export const getSupervisors = async (req, res) => {
  try {
    // Example Postgres function:
    //   CREATE OR REPLACE FUNCTION get_supervisors()
    //   RETURNS SETOF jsonb AS $$ ... $$ LANGUAGE plpgsql;
    //
    // Or RETURNS TABLE(...) with one row per supervisor.
    const { rows } = await db.query("SELECT * FROM get_supervisors()");

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No supervisors found." });
    }

    // If your function returns a JSON array in a single row, adjust here.
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching supervisors:", err);
    return res.status(500).send("Server error");
  }
};

import { db } from "../config/db.js";

export const fetchRemainingLeaveCount = async (req, res) => {
  const { e_id } = req.user;

  try {
    const currentYear = new Date().getFullYear();
    console.log(currentYear);
    console.log("e_id is ", e_id);

    // Example Postgres function:
    //   get_remaining_leave_count(p_employee_id uuid, p_year int)
    const { rows } = await db.query(
      "SELECT * FROM get_remaining_leave_count($1, $2)",
      [e_id, currentYear]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .send("No leave count found for given employee id");
    }

    console.log("Remaining leave count fetched");
    console.log("Results:", rows);
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching remaining leave count:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchTotalEmployeeCount = async (req, res) => {
  try {
    // Example Postgres function:
    //   get_total_employees_count() RETURNS integer
    const { rows } = await db.query(
      "SELECT get_total_employees_count() AS total_count"
    );

    console.log("Total employee count fetched");
    console.log("Results:", rows);

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching total employee count:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchAbsentEmployeeCount = async (req, res) => {
  try {
    // Example Postgres function:
    //   get_absent_employees_count() RETURNS integer
    const { rows } = await db.query(
      "SELECT get_absent_employees_count() AS absent_count"
    );

    console.log("Total absent employee count fetched");
    console.log("Results:", rows);

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching absent employee count:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchRoleCount = async (req, res) => {
  try {
    // Example Postgres function:
    //   get_role_count() RETURNS TABLE (...)
    const { rows } = await db.query("SELECT * FROM get_role_count()");

    console.log("Role Count fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching role count:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchUpcomingLeaves = async (req, res) => {
  const { e_id } = req.user;

  try {
    // Example Postgres function:
    //   get_upcoming_leaves(p_employee_id uuid) RETURNS TABLE (...)
    const { rows } = await db.query(
      "SELECT * FROM get_upcoming_leaves($1)",
      [e_id]
    );

    console.log("Upcoming leaves fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching upcoming leaves:", err);
    return res.status(500).send("Server error");
  }
};
import { db } from "../config/db.js";

// These handlers now assume equivalent PostgreSQL functions exist
// with the same names as the original MySQL procedures:
//   get_job_titles(), create_job_title(text), get_pay_grade_leave_limits(),
//   update_max_leave_count(p_name text, p_type text, p_max_leave_count int)

export const fetchJobTitles = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM get_job_titles()");

    console.log("Job titles fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching job titles:", err);
    return res.status(500).send("Server error");
  }
};

export const addJobTitle = async (req, res) => {
  const { jobTitle } = req.body;

  try {
    await db.query("SELECT create_job_title($1)", [jobTitle]);

    console.log("Job title added");

    return res.json({ message: "Job title added successfully" });
  } catch (err) {
    console.error("Error adding job title:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchMaxLeaveCount = async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM get_pay_grade_leave_limits()"
    );

    console.log("Leave counts fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching leave counts:", err);
    return res.status(500).send("Server error");
  }
};

export const updateMaxLeaveCount = async (req, res) => {
  const { name, type, max_leave_count } = req.body;

  try {
    await db.query("SELECT update_max_leave_count($1, $2, $3)", [
      name,
      type,
      max_leave_count,
    ]);

    console.log("Leave count updated");

    return res.json({ message: "Leave count updated successfully" });
  } catch (err) {
    console.error("Error updating leave count:", err);
    return res.status(500).send("Server error");
  }
};
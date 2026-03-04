import { db } from "../config/db.js";

// Assumes:
//   - Table job_title exists in the current schema
//   - GetPayGradeNames() and GetDepartmentsByCountry(country text) are PostgreSQL functions

export const getJobTitles = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM job_title");

    if (!rows || rows.length === 0) {
      return res.status(404).send("JobTitles not found");
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching JobTitles:", err);
    return res.status(500).send("Server error");
  }
};

export const getPayGrades = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM GetPayGradeNames()");

    if (!rows || rows.length === 0) {
      return res.status(404).send("Pay grades not found");
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching pay grades:", err);
    return res.status(500).send("Server error");
  }
};

export const getDepartments = async (req, res) => {
  const countryName = "Sri Lanka";

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetDepartmentsByCountry($1)",
      [countryName]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send("Departments not found");
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).send("Server error");
  }
};

export const employmentStats = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT employment_state_id,
              employment_type || ' ' || work_schedule AS employment_status
       FROM employment_state`
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send("Employment stats not found");
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching employment stats:", err);
    return res.status(500).send("Server error");
  }
}
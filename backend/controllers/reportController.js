import { db } from "../config/db.js";

// Assumes PostgreSQL functions:
//   GetEmployeeReport(department text),
//   GetLeaveBalance(department text, leave_type text),
//   GetLeaveReport(department text),
//   GetEmployeeAttribute(attribute_name text)

export const getEmployeeReport = async (req, res) => {
  const department = req.params.department;

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetEmployeeReport($1)",
      [department]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error generating employee report" });
  }
};

export const getLeaveBalanceReport = async (req, res) => {
  const { department, leaveType } = req.params;

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetLeaveBalance($1, $2)",
      [department, leaveType]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No leave balance found" });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error generating leave balance report" });
  }
};

export const getLeaveReport = async (req, res) => {
  const department = req.params.department;

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetLeaveReport($1)",
      [department]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No leave found" });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error generating leave report" });
  }
};

export const getCustomFieldReport = async (req, res) => {
  const attribute_name = req.params.attribute_name;

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetEmployeeAttribute($1)",
      [attribute_name]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No custom fields found" });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error generating custom field report" });
  }
};

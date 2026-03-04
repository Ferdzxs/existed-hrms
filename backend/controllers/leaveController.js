import { db } from "../config/db.js";

export const getemployeeleavedetail = async (req, res) => {
  const { employee_id } = req.params;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    // Example Postgres function:
    //   get_leave_details(p_employee_id uuid) RETURNS TABLE (...)
    const { rows } = await db.query(
      "SELECT * FROM get_leave_details($1)",
      [employee_id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No employee leave detail found." });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching employee leave detail:", err);
    return res.status(500).send("Server error");
  }
};

export const getpendingleavedetail = async (req, res) => {
  const { e_id } = req.user;

  try {
    // Example Postgres function:
    //   get_pending_leaves(p_employee_id uuid) RETURNS TABLE (...)
    const { rows } = await db.query(
      "SELECT * FROM get_pending_leaves($1)",
      [e_id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No pending leave detail found." });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching pending leave detail:", err);
    return res.status(500).send("Server error");
  }
};

export const approveleaverequest = async (req, res) => {
  const { leave_record_id } = req.params;

  if (!leave_record_id) {
    return res.status(400).json({ message: "Leave Record ID is required" });
  }

  const approved_date = new Date().toISOString().split("T")[0];

  try {
    // Example Postgres function:
    //   approve_leave_record(p_leave_record_id uuid, p_approved_date date)
    await db.query("SELECT approve_leave_record($1, $2)", [
      leave_record_id,
      approved_date,
    ]);

    return res
      .status(200)
      .json({ message: "Leave request approved successfully" });
  } catch (err) {
    console.error("Error approving leave request:", err);
    return res.status(500).send("Server error");
  }
};

export const rejectleaverequest = async (req, res) => {
  const { leave_record_id } = req.params;

  if (!leave_record_id) {
    return res.status(400).json({ message: "Leave Record ID is required" });
  }

  try {
    // Example Postgres function:
    //   reject_leave_record(p_leave_record_id uuid)
    await db.query("SELECT reject_leave_record($1)", [leave_record_id]);

    return res
      .status(200)
      .json({ message: "Leave request rejected successfully" });
  } catch (err) {
    console.error("Error rejecting leave request:", err);
    return res.status(500).send("Server error");
  }
};

export const getLeaveTypes = async (req, res) => {
  try {
    // Example Postgres function:
    //   get_leave_types() RETURNS TABLE (...)
    const { rows } = await db.query("SELECT * FROM get_leave_types()");

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching leave types:", err);
    return res.status(500).send("Server error");
  }
};

export const applyLeave = async (req, res) => {
  const { leave_type_id, start_date, end_date, reason } = req.body;
  const { e_id } = req.user;
  const applied_date = new Date().toISOString().split("T")[0];
  console.log(applied_date);

  if (!leave_type_id || !start_date || !end_date || !reason) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Example Postgres function:
    //   insert_leave_record(p_employee_id uuid, p_leave_type_id int, p_start_date date, p_end_date date, p_applied_date date, p_reason text)
    await db.query(
      "SELECT insert_leave_record($1, $2, $3, $4, $5, $6)",
      [e_id, leave_type_id, start_date, end_date, applied_date, reason]
    );

    return res
      .status(200)
      .json({ message: "Leave application submitted successfully" });
  } catch (err) {
    console.error("Error applying for leave:", err);
    return res.status(500).send("Server error");
  }
};

export const getLeaveHistory = async (req, res) => {
  const { e_id } = req.user;

  try {
    // Reuse get_leave_details for the logged in user
    const { rows } = await db.query("SELECT * FROM get_leave_details($1)", [
      e_id,
    ]);

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No leave history found." });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching leave history:", err);
    return res.status(500).send("Server error");
  }
};

export const getLeaveBalance = async (req, res) => {
  const { e_id } = req.user;
  const { leave_type_id } = req.body;

  console.log(req.body);

  if (!leave_type_id) {
    return res.status(400).json({ message: "leave_type_id is required" });
  }

  try {
    // Example Postgres function:
    //   leave_balance(p_employee_id uuid, p_leave_type_id int) RETURNS numeric
    const { rows } = await db.query(
      "SELECT * FROM leave_balance($1, $2)",
      [e_id, leave_type_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No leave balance found." });
    }

    // If your function returns a single row with e.g. "balance" column, adjust here.
    const leaveBalance = rows[0];
    return res.status(200).json(leaveBalance);
  } catch (err) {
    console.error("Error fetching leave balance:", err);
    return res.status(500).send("Server error");
  }
};
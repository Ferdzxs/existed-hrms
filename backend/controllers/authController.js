import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

// NOTE:
// This controller now targets PostgreSQL (e.g. Supabase Postgres) via `pg`.
// It assumes you have created equivalent PostgreSQL functions:
//   - user_login(email text) RETURNS record
//   - create_user(employee_id, username, password_hash, email, role) RETURNS text
//   - add_employee(...) RETURNS uuid (employee_id)
//   - insert_custom_attributes_for_employee(employee_id uuid, attribute_id uuid, value text)
// and that they mirror the behavior of the original MySQL stored procedures.

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // PostgreSQL: call a function instead of MySQL stored procedure
    // Example function signature in Postgres:
    //   CREATE OR REPLACE FUNCTION user_login(p_email text)
    //   RETURNS TABLE (
    //     user_id uuid,
    //     employee_id uuid,
    //     role text,
    //     password text,
    //     login_status text
    //   ) AS $$ ... $$ LANGUAGE plpgsql;
    const { rows } = await db.query("SELECT * FROM user_login($1)", [email]);

    if (!rows || rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    const user = rows[0];
    const login_status = user.login_status;

    console.log(user.role);
    console.log(login_status);

    const hashedPassword = user.password;

    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign(
      { e_id: user.employee_id, role: user.role, u_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).send("Server error");
  }
};

export const addUser = async (req, res) => {
  const { employee_Id, userName, password, email, role } = req.body;
  const password_hash = bcrypt.hashSync(password, 10);

  try {
    // Example Postgres function:
    //   CREATE OR REPLACE FUNCTION create_user(...)
    //   RETURNS text AS $$ ... $$ LANGUAGE plpgsql;
    const { rows } = await db.query(
      "SELECT * FROM create_user($1, $2, $3, $4, $5) AS result",
      [employee_Id, userName, password_hash, email, role]
    );

    const result = rows[0]?.result || rows[0]?.create_user;

    if (result === "User created successfully") {
      return res.status(201).send(result);
    }

    return res.status(400).send(result || "Unable to create user");
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).send("Server error");
  }
};

export const addEmployee = async (req, res) => {
  const {
    NIC,
    First_Name,
    Last_Name,
    Email,
    DOB,
    Gender,
    Address,
    Marital_Status,
    Department_ID,
    Supervisor_ID,
    Job_Title_ID,
    Pay_Grade_ID,
    Employment_Type,
    Work_Schedule,
    Hired_Date,
    Termination_Date,
    Contact_Number1,
    Contact_Number2,
    Emergency_Contact_Name,
    Emergency_Contact_Number,
    Emergency_Contact_Relationship,
    Dependant_Name,
    Dependant_Relationship,
    Dependant_DOB,
    Dependant_Gender,
    Dependent_Contact_Number,
    custom_attributes,
  } = req.body;

  const formatDate = (date) =>
    date ? new Date(date).toISOString().slice(0, 10) : null;

  const makeNullIfEmpty = (value) => (value === "" ? null : value);

  const values = [
    makeNullIfEmpty(NIC),
    makeNullIfEmpty(First_Name),
    makeNullIfEmpty(Last_Name),
    makeNullIfEmpty(Email),
    formatDate(makeNullIfEmpty(DOB)),
    makeNullIfEmpty(Gender),
    makeNullIfEmpty(Address),
    makeNullIfEmpty(Marital_Status),
    makeNullIfEmpty(Department_ID),
    makeNullIfEmpty(Supervisor_ID),
    makeNullIfEmpty(Job_Title_ID),
    makeNullIfEmpty(Pay_Grade_ID),
    makeNullIfEmpty(Employment_Type),
    makeNullIfEmpty(Work_Schedule),
    formatDate(makeNullIfEmpty(Hired_Date)),
    formatDate(makeNullIfEmpty(Termination_Date)),
    makeNullIfEmpty(Contact_Number1),
    makeNullIfEmpty(Contact_Number2),
    makeNullIfEmpty(Emergency_Contact_Name),
    makeNullIfEmpty(Emergency_Contact_Number),
    makeNullIfEmpty(Emergency_Contact_Relationship),
    makeNullIfEmpty(Dependant_Name),
    makeNullIfEmpty(Dependant_Relationship),
    formatDate(makeNullIfEmpty(Dependant_DOB)),
    makeNullIfEmpty(Dependant_Gender),
    makeNullIfEmpty(Dependent_Contact_Number),
  ];

  console.log(req.body);

  try {
    // Example Postgres function:
    //   CREATE OR REPLACE FUNCTION add_employee(...)
    //   RETURNS uuid AS $$ ... $$ LANGUAGE plpgsql;
    const employeeResult = await db.query(
      "SELECT add_employee($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) AS employee_id",
      values
    );

    const employeeID =
      employeeResult.rows[0]?.employee_id ||
      employeeResult.rows[0]?.add_employee;

    if (!employeeID) {
      return res
        .status(500)
        .json({ error: "Employee ID not returned from add_employee()" });
    }

    // Insert custom attributes
    if (Array.isArray(custom_attributes) && custom_attributes.length > 0) {
      const attributeQuery =
        "SELECT insert_custom_attributes_for_employee($1, $2, $3)";

      for (const attr of custom_attributes) {
        const attrValues = [employeeID, attr.attribute_id, attr.value];
        try {
          await db.query(attributeQuery, attrValues);
        } catch (error) {
          console.log("Error inserting custom attribute:", error);
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Employee added successfully!", employee_id: employeeID });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Database error", details: error });
  }
};

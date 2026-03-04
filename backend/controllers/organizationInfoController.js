import { db } from "../config/db.js";

// Assumes PostgreSQL functions:
//   get_organization_details(), get_branch_details(),
//   update_branch_details(branch_id uuid, country text, address text,
//                         organization_id uuid, branch_name text, phone_number text)

export const fetchOrganizationInfo = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM get_organization_details()");

    console.log("Organization details fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching organization details:", err);
    return res.status(500).send("Server error");
  }
};

export const fetchBranchInfo = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM get_branch_details()");

    console.log("Branch details fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching branch details:", err);
    return res.status(500).send("Server error");
  }
};

export const updateBranchInfo = async (req, res) => {
  const {
    branch_id,
    branch_name,
    country,
    address,
    phone_number,
    organization_id,
  } = req.body;

  try {
    await db.query(
      "SELECT update_branch_details($1, $2, $3, $4, $5, $6)",
      [branch_id, country, address, organization_id, branch_name, phone_number]
    );

    console.log("Branch details updated");

    return res.json({ message: "Branch details updated" });
  } catch (err) {
    console.error("Error updating branch details:", err);
    return res.status(500).send("Server error");
  }
};
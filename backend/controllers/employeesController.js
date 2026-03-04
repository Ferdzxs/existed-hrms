import { db } from "../config/db.js";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Assumes PostgreSQL functions with the same names as the original MySQL
// procedures exist:
//   GetEmployeeList(), GetEmployeeDataForView(employee_id uuid),
//   GetDependentDetails(employee_id uuid), GetEmergencyContacts(employee_id uuid),
//   GetCustomAttributesforGivenId(employee_id uuid)

export const getAllEmployees = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM GetEmployeeList()");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching employee list:", err);
    return res.status(500).send("Server error");
  }
};

export const getEmployeeByIdForHr = async (req, res) => {
  const employeeId = req.params.id;

  try {
    const employeeResult = await db.query(
      "SELECT * FROM GetEmployeeDataForView($1)",
      [employeeId]
    );

    if (!employeeResult.rows || employeeResult.rows.length === 0) {
      return res.status(404).send("Employee not found");
    }

    const firstRow = employeeResult.rows[0];

    const employee = {
      id: firstRow.id,
      first_name: firstRow.first_name,
      last_name: firstRow.last_name,
      name: firstRow.name,
      NIC: firstRow.nic,
      username: firstRow.username,
      birthday: formatDate(firstRow.birthday),
      gender: firstRow.gender,
      job_title_id: firstRow.job_title_id,
      job_title: firstRow.job_title,
      pay_grade_id: firstRow.pay_grade_id,
      pay_grade: firstRow.pay_grade,
      dept_id: firstRow.dept_id,
      department: firstRow.department,
      branch: firstRow.branch,
      hired_date: formatDate(firstRow.hired_date),
      employment_state_id: firstRow.employment_state_id,
      employment_status: firstRow.employment_status,
      marital_state: firstRow.marital_state,
      email: firstRow.email,
      address: firstRow.address,
      supervisor_name: firstRow.supervisor_name,
      phone_numbers: [],
      dependents: [],
      emergency_contacts: [],
    };

    employeeResult.rows.forEach((row) => {
      if (row.phone_number) {
        employee.phone_numbers.push(row.phone_number);
      }
    });

    const dependentResult = await db.query(
      "SELECT * FROM GetDependentDetails($1)",
      [employeeId]
    );

    dependentResult.rows.forEach((row) => {
      employee.dependents.push({
        name: row.dependent_name,
        date_of_birth: formatDate(row.dependent_birthday),
        gender: row.dependent_gender,
        phone_number: row.dependent_phone_number,
        relationship: row.relationship,
      });
    });

    const emergencyResult = await db.query(
      "SELECT * FROM GetEmergencyContacts($1)",
      [employeeId]
    );

    emergencyResult.rows.forEach((row) => {
      employee.emergency_contacts.push({
        name: row.name,
        contact_id: row.contact_id,
        phone: row.phone,
        relationship: row.relationship,
      });
    });

    return res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching employee data:", err);
    return res.status(500).send("Server error");
  }
};

export const getEachEmployeeCostumAttributes = async (req, res) => {
  const employeeId = req.params.id;

  try {
    const { rows } = await db.query(
      "SELECT * FROM GetCustomAttributesforGivenId($1)",
      [employeeId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send("Custom attributes not found");
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching custom attributes:", err);
    return res.status(500).send("Server error");
  }
};


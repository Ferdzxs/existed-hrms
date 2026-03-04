import { db } from "../config/db.js";

// Assumes PostgreSQL functions:
//   UpdateEmployeeDataInDataBase(..., phone_numbers_json text,
//                                dependents_json text, emergency_contacts_json text)
//   UpdatecustomAttributes(employee_id uuid, custom_attributes_json text)

export const updateEmployeeData = async (req, res) => {
  const employeeId = req.params.id;
  const {
    first_name,
    last_name,
    NIC,
    birthday,
    dept_id,
    job_title_id,
    pay_grade_id,
    employment_state_id,
    address,
    marital_state,
    phone_numbers,
    dependents,
    emergency_contacts,
    custom_Attributes

  } = req.body;
  


  // JSON Stringify if arrays are being passed directly
  const phoneNumbersJson = JSON.stringify(phone_numbers);
  const emergencyContactsJson = JSON.stringify(emergency_contacts);

  // Handle birthday, set to null if empty
  const birthdayValue = birthday && birthday.trim() !== '' ? birthday : null;

  // Filter and process dependents to include only those with non-empty date_of_birth
  const processedDependents = dependents
    .filter(dependent => dependent.date_of_birth && dependent.date_of_birth.trim() !== '')
    .map(dependent => ({
      name: dependent.name,
      relationship: dependent.relationship,
      date_of_birth: dependent.date_of_birth, // Already filtered
      gender: dependent.gender,
      phone_number: dependent.phone_number,
    }));

  const query = `SELECT UpdateEmployeeDataInDataBase(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    employeeId,
    first_name,
    last_name,
    NIC,
    birthdayValue,  // Use the handled birthday value
    dept_id,
    job_title_id,
    pay_grade_id,
    employment_state_id,
    address,
    marital_state,
    phoneNumbersJson,
    JSON.stringify(processedDependents),  // Use processed dependents
    emergencyContactsJson,
  ];

  try {
    await db.query(query, values);

    if (custom_Attributes) {
      const customAttributesQuery = `SELECT UpdatecustomAttributes(?, ?)`;
      const customAttributesValues = [
        employeeId,
        JSON.stringify(custom_Attributes),
      ];

      await db.query(customAttributesQuery, customAttributesValues);
    }

    return res
      .status(200)
      .json({ message: "Employee updated successfully!" });
  } catch (err) {
    console.error("Error updating employee data:", err);
    return res.status(500).send("Server error");
  }
};


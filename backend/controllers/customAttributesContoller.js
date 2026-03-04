import { db } from "../config/db.js";

// Assumes equivalent PostgreSQL functions exist:
//   get_custom_attributes(), remove_custom_attribute(attribute_id uuid),
//   get_entry_count_in_employee_attribute(), insert_first_custom_attribute(key text, default_value text),
//   insert_custom_attribute(key text, default_value text)

export const getCustomAttributes = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM get_custom_attributes()");

    console.log("Custom attributes fetched");
    console.log("Results:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching custom attributes:", err);
    return res.status(500).send("Server error");
  }
};

export const removeAttribute = async (req, res) => {
  const { attributeId } = req.params;

  try {
    await db.query("SELECT remove_custom_attribute($1)", [attributeId]);

    console.log("Custom attribute removed");
    return res.json({ message: "Custom attribute removed" });
  } catch (err) {
    console.error("Error removing custom attribute:", err);
    return res.status(500).send("Server error");
  }
};

export const addAttribute = async (req, res) => {
  try {
    const countResult = await db.query(
      "SELECT get_entry_count_in_employee_attribute() AS entry_count"
    );

    const entryCount =
      countResult.rows[0]?.entry_count ??
      countResult.rows[0]?.get_entry_count_in_employee_attribute;

    const { attributeKey, defaultValue } = req.body;

    let sql;
    if (entryCount === 0) {
      sql = "SELECT insert_first_custom_attribute($1, $2)";
    } else {
      sql = "SELECT insert_custom_attribute($1, $2)";
    }

    const result = await db.query(sql, [attributeKey, defaultValue]);

    console.log("Custom attribute added");
    console.log(result.rows[0]);

    return res.json(result.rows);
  } catch (err) {
    console.error("Error adding custom attribute:", err);
    return res.status(500).send("Server error");
  }
};

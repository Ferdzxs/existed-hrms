import bcrypt from "bcryptjs";

// Mock Database to allow logging in when Supabase is unreachable
// This mock is designed to support the user_login function call in authController.js

export const db = {
  query: async (text, params) => {
    console.log(`[MockDB] Executing: ${text} with params: ${params}`);

    // Handle user_login(email)
    if (text.includes("user_login")) {
      const email = params[0];

      if (email === "admin@example.com") {
        return {
          rows: [{
            user_id: "00000000-0000-0000-0000-000000000000",
            employee_id: "11111111-1111-1111-1111-111111111111",
            role: "Admin",
            password: await bcrypt.hash("Admin123!", 10), // Mocked hashed password
            login_status: "OK"
          }]
        };
      }

      return { rows: [] };
    }

    // Handle dashboard data
    if (text.includes("get_upcoming_leaves")) {
      return { rows: [] };
    }

    if (text.includes("get_notification_by_user_id")) {
      return { rows: [] };
    }

    // Default empty response
    return { rows: [] };
  }
};

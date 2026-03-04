-- PostgreSQL/Supabase schema for HRMS
-- This is a hand-converted starting point from the MySQL dump
-- You can run this in Supabase SQL editor (adjust schema/database name as needed).

-- Enable useful extensions (UUID generation etc.)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Core tables (examples)
-- =========================

-- organization
CREATE TABLE IF NOT EXISTS organization (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL
);

-- branch (from MySQL `branch`)
CREATE TABLE IF NOT EXISTS branch (
  branch_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country        VARCHAR(50)  NOT NULL,
  address        VARCHAR(250),
  organization_id UUID REFERENCES organization(organization_id),
  branch_name    VARCHAR(100),
  phone_number   VARCHAR(25)
);

-- employment_state (from MySQL `employment_state`)
CREATE TABLE IF NOT EXISTS employment_state (
  employment_state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_type     VARCHAR(50) NOT NULL,
  work_schedule       VARCHAR(50) NOT NULL
);

-- job_title (from MySQL `job_title`)
CREATE TABLE IF NOT EXISTS job_title (
  job_title_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(30) NOT NULL UNIQUE
);

-- pay_grade (simplified; adjust columns to match your dump)
CREATE TABLE IF NOT EXISTS pay_grade (
  pay_grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(50) NOT NULL
);

-- department (from MySQL `department`)
-- NOTE: Create department *before* employee, without manager_id FK.
CREATE TABLE IF NOT EXISTS department (
  dept_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50) NOT NULL,
  manager_id UUID,
  branch_id  UUID REFERENCES branch(branch_id)
);

-- employee (from MySQL `employee`)
CREATE TABLE IF NOT EXISTS employee (
  employee_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  NIC                 VARCHAR(20) UNIQUE,
  first_name          VARCHAR(50) NOT NULL,
  last_name           VARCHAR(50),
  date_of_birth       DATE NOT NULL,
  marital_state       VARCHAR(10),
  gender              VARCHAR(10),
  address             VARCHAR(250),
  job_title_id        UUID REFERENCES job_title(job_title_id),
  pay_grade_id        UUID REFERENCES pay_grade(pay_grade_id),
  employment_state_id UUID REFERENCES employment_state(employment_state_id),
  supervisor_id       UUID REFERENCES employee(employee_id),
  dept_id             UUID REFERENCES department(dept_id),
  hired_date          DATE,
  termination_date    DATE,
  email               VARCHAR(150) UNIQUE
);

-- Now that employee exists, add manager_id FK from department to employee.
-- Wrapped in a DO block so it is safe to run multiple times.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'department_manager_fk'
      AND conrelid = 'department'::regclass
  ) THEN
    ALTER TABLE department
      ADD CONSTRAINT department_manager_fk
      FOREIGN KEY (manager_id) REFERENCES employee(employee_id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END;
$$;

-- contact_detail
CREATE TABLE IF NOT EXISTS contact_detail (
  employee_id  UUID NOT NULL REFERENCES employee(employee_id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  PRIMARY KEY (employee_id, phone_number)
);

-- dependent
CREATE TABLE IF NOT EXISTS dependent (
  employee_id  UUID NOT NULL REFERENCES employee(employee_id) ON DELETE CASCADE,
  name         VARCHAR(50) NOT NULL,
  relationship VARCHAR(30),
  date_of_birth DATE,
  gender       VARCHAR(10),
  phone_number VARCHAR(20),
  PRIMARY KEY (employee_id, name)
);

-- emergency_contact
CREATE TABLE IF NOT EXISTS emergency_contact (
  contact_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employee(employee_id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  phone       VARCHAR(20),
  relationship VARCHAR(20)
);

-- custom_attribute
CREATE TABLE IF NOT EXISTS custom_attribute (
  attribute_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_name VARCHAR(50) NOT NULL
);

-- employee_custom_attribute (denormalised 3-slot mapping as in MySQL)
CREATE TABLE IF NOT EXISTS employee_custom_attribute (
  employee_id UUID PRIMARY KEY REFERENCES employee(employee_id) ON DELETE CASCADE,
  key1        UUID REFERENCES custom_attribute(attribute_id) ON DELETE SET NULL,
  value1      VARCHAR(100),
  key2        UUID REFERENCES custom_attribute(attribute_id) ON DELETE SET NULL,
  value2      VARCHAR(100),
  key3        UUID REFERENCES custom_attribute(attribute_id) ON DELETE SET NULL,
  value3      VARCHAR(100)
);

-- inquiry (support tickets)
CREATE TABLE IF NOT EXISTS inquiry (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) NOT NULL,
  subject      VARCHAR(100) NOT NULL,
  description  VARCHAR(255) NOT NULL,
  type         VARCHAR(20)  NOT NULL,
  reply_status BOOLEAN      DEFAULT FALSE
);

-- leave_type, leave_balance, leave_record (simplified to match controllers)
CREATE TABLE IF NOT EXISTS leave_type (
  leave_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) NOT NULL
);

-- max_leave_count: per pay grade / leave type limits used by trigger
CREATE TABLE IF NOT EXISTS max_leave_count (
  pay_grade_id  UUID NOT NULL REFERENCES pay_grade(pay_grade_id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_type(leave_type_id) ON DELETE CASCADE,
  max_leave_count INTEGER NOT NULL,
  PRIMARY KEY (pay_grade_id, leave_type_id)
);

CREATE TABLE IF NOT EXISTS leave_balance (
  employee_id  UUID NOT NULL REFERENCES employee(employee_id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_type(leave_type_id),
  year         INTEGER NOT NULL,
  balance      INTEGER,
  PRIMARY KEY (employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_record (
  leave_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID REFERENCES employee(employee_id),
  leave_type_id   UUID REFERENCES leave_type(leave_type_id),
  start_date      DATE,
  end_date        DATE,
  status          VARCHAR(20) DEFAULT 'Pending',
  applied_date    DATE,
  approved_date   DATE,
  reason          VARCHAR(255)
);

-- =========================
-- Notification tables (example)
-- =========================

CREATE TABLE IF NOT EXISTS "user" (
  user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee(employee_id),
  username    VARCHAR(50) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  email       VARCHAR(150) UNIQUE,
  role        VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(user_id),
  message         TEXT NOT NULL,
  status          VARCHAR(10) NOT NULL DEFAULT 'unread',
  type            VARCHAR(20) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Example PostgreSQL functions matching controllers
-- (You should adapt bodies to match your exact business logic)
-- =========================

-- Login: replaces MySQL procedure user_login
CREATE OR REPLACE FUNCTION user_login(p_email TEXT)
RETURNS TABLE (
  user_id     UUID,
  employee_id UUID,
  role        TEXT,
  password    TEXT,
  login_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.user_id,
         u.employee_id,
         u.role,
         u.password,
         'OK'::TEXT AS login_status
  FROM "user" u
  WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create user: returns a status message
CREATE OR REPLACE FUNCTION CreateUser(
  p_employee_id UUID,
  p_username    TEXT,
  p_password    TEXT,
  p_email       TEXT,
  p_role        TEXT
)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO "user"(employee_id, username, password, email, role)
  VALUES (p_employee_id, p_username, p_password, p_email, p_role);

  RETURN 'User created successfully';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'User already exists';
END;
$$ LANGUAGE plpgsql;

-- Example leave balance function matching leaveController.getLeaveBalance
CREATE OR REPLACE FUNCTION leave_balance(
  p_employee_id UUID,
  p_leave_type_id UUID
)
RETURNS TABLE (
  employee_id UUID,
  leave_type_id UUID,
  year INTEGER,
  balance INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT lb.employee_id, lb.leave_type_id, lb.year, lb.balance
  FROM leave_balance lb
  WHERE lb.employee_id = p_employee_id
    AND lb.leave_type_id = p_leave_type_id
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- You should similarly create Postgres functions for:
--   GetEmployeeList, GetEmployeeDataForView, GetDependentDetails,
--   GetEmergencyContacts, GetCustomAttributesforGivenId,
--   get_custom_attributes, remove_custom_attribute,
--   insert_first_custom_attribute, insert_custom_attribute,
--   get_remaining_leave_count, get_upcoming_leaves,
--   get_notification_all, get_notification_by_user_id,
--   get_notification_by_id, update_notification_status,
--   delete_notification_by_id, get_unread_notification_count,
--   get_job_titles, create_job_title, get_pay_grade_leave_limits,
--   update_max_leave_count, get_profile, GetEmployeeReport,
--   GetLeaveBalance, GetLeaveReport, GetEmployeeAttribute,
--   insert_inquiry, UpdateEmployeeDataInDataBase, UpdatecustomAttributes,
--   and any other procedures referenced in the controllers.

-- =========================
-- Triggers (converted from MySQL examples)
-- =========================

-- Trigger: set_employee_leave_balance_records
CREATE OR REPLACE FUNCTION trg_set_employee_leave_balance_records()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leave_balance (employee_id, leave_type_id, year, balance)
  SELECT NEW.employee_id, lt.leave_type_id,
         EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
         mlc.max_leave_count
  FROM leave_type lt
  JOIN max_leave_count mlc ON lt.leave_type_id = mlc.leave_type_id
  WHERE mlc.pay_grade_id = NEW.pay_grade_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is idempotent when script is re-run
DROP TRIGGER IF EXISTS set_employee_leave_balance_records ON employee;

CREATE TRIGGER set_employee_leave_balance_records
AFTER INSERT ON employee
FOR EACH ROW
EXECUTE FUNCTION trg_set_employee_leave_balance_records();

-- Trigger: notification_on_employee_information_update
CREATE OR REPLACE FUNCTION trg_notification_on_employee_information_update()
RETURNS TRIGGER AS $$
DECLARE
  employee_user_id UUID;
BEGIN
  SELECT u.user_id INTO employee_user_id
  FROM "user" u
  WHERE u.employee_id = NEW.employee_id;

  IF employee_user_id IS NOT NULL THEN
    PERFORM create_notification(
      employee_user_id,
      'Your profile details have been updated by the HR Manager.',
      'unread',
      'alert',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is idempotent when script is re-run
DROP TRIGGER IF EXISTS notification_on_employee_information_update ON employee;

CREATE TRIGGER notification_on_employee_information_update
AFTER UPDATE ON employee
FOR EACH ROW
EXECUTE FUNCTION trg_notification_on_employee_information_update();

-- NOTE: You still need to define create_notification(...) and any other
-- referenced functions to fully match your original MySQL logic.

-- ============================================
-- Seed: default Admin employee + user account
-- ============================================
DO $$
DECLARE
  v_org_id    UUID;
  v_branch_id UUID;
  v_es_id     UUID;
  v_jt_id     UUID;
  v_pg_id     UUID;
  v_dept_id   UUID;
  v_emp_id    UUID;
BEGIN
  -- If user already exists, do nothing
  IF EXISTS (SELECT 1 FROM "user" WHERE email = 'admin@example.com') THEN
    RETURN;
  END IF;

  -- Organization (create one if none exists)
  SELECT organization_id INTO v_org_id
  FROM organization
  ORDER BY organization_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organization (name)
    VALUES ('Jupiter Apparels HRMS')
    RETURNING organization_id INTO v_org_id;
  END IF;

  -- Branch (reuse existing if same name/org already there)
  SELECT branch_id INTO v_branch_id
  FROM branch
  WHERE branch_name = 'Head Office'
    AND organization_id = v_org_id
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    INSERT INTO branch (country, address, organization_id, branch_name, phone_number)
    VALUES ('Sri Lanka', 'Main Branch Address', v_org_id, 'Head Office', '011-1234567')
    RETURNING branch_id INTO v_branch_id;
  END IF;

  -- Employment state (Permanent / Full Time)
  SELECT employment_state_id INTO v_es_id
  FROM employment_state
  WHERE employment_type = 'Permanent'
    AND work_schedule = 'Full Time'
  LIMIT 1;

  IF v_es_id IS NULL THEN
    INSERT INTO employment_state (employment_type, work_schedule)
    VALUES ('Permanent', 'Full Time')
    RETURNING employment_state_id INTO v_es_id;
  END IF;

  -- Job title (HR Manager)
  SELECT job_title_id INTO v_jt_id
  FROM job_title
  WHERE title = 'HR Manager'
  LIMIT 1;

  IF v_jt_id IS NULL THEN
    INSERT INTO job_title (title)
    VALUES ('HR Manager')
    RETURNING job_title_id INTO v_jt_id;
  END IF;

  -- Pay grade (PG-1)
  SELECT pay_grade_id INTO v_pg_id
  FROM pay_grade
  WHERE name = 'PG-1'
  LIMIT 1;

  IF v_pg_id IS NULL THEN
    INSERT INTO pay_grade (name)
    VALUES ('PG-1')
    RETURNING pay_grade_id INTO v_pg_id;
  END IF;

  -- Department (HR Department)
  SELECT dept_id INTO v_dept_id
  FROM department
  WHERE name = 'HR Department'
    AND branch_id = v_branch_id
  LIMIT 1;

  IF v_dept_id IS NULL THEN
    INSERT INTO department (name, manager_id, branch_id)
    VALUES ('HR Department', NULL, v_branch_id)
    RETURNING dept_id INTO v_dept_id;
  END IF;

  -- Employee (reuse existing if NIC/email already present)
  SELECT employee_id INTO v_emp_id
  FROM employee
  WHERE NIC = '123456789V'
     OR email = 'admin@example.com'
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    INSERT INTO employee (
      NIC,
      first_name,
      last_name,
      date_of_birth,
      marital_state,
      gender,
      address,
      job_title_id,
      pay_grade_id,
      employment_state_id,
      supervisor_id,
      dept_id,
      hired_date,
      termination_date,
      email
    )
    VALUES (
      '123456789V',
      'Admin',
      'User',
      DATE '1990-01-01',
      'Single',
      'male',
      'Some Address',
      v_jt_id,
      v_pg_id,
      v_es_id,
      NULL,
      v_dept_id,
      CURRENT_DATE,
      NULL,
      'admin@example.com'
    )
    RETURNING employee_id INTO v_emp_id;
  END IF;

  -- User account (password: Admin123!)
  INSERT INTO "user" (employee_id, username, password, email, role)
  VALUES (
    v_emp_id,
    'admin',
    crypt('Admin123!', gen_salt('bf')),
    'admin@example.com',
    'Admin'
  );
END;
$$;

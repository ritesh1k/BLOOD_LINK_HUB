CREATE DATABASE IF NOT EXISTS blood_bank;
USE blood_bank;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Singleton admin account table (exactly one row enforced by id=1)
CREATE TABLE IF NOT EXISTS admin (
  id TINYINT PRIMARY KEY DEFAULT 1,
  admin_id VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (id = 1)
);

-- Default single admin credentials: admin_id=admin, password=admin123
INSERT INTO admin (id, admin_id, password_hash)
VALUES (1, 'admin', '$2a$10$KA3yvZtsrwCQslO5FZrLNePVtCUxRrgAr6zC0N4Cuk8tS1MGiiQGS')
ON DUPLICATE KEY UPDATE admin_id = admin_id;

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  quantity INT NOT NULL,
  patient_name VARCHAR(120),
  patient_age INT,
  patient_gender ENUM('male','female','other'),
  hospital_name VARCHAR(150),
  doctor_name VARCHAR(120),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(12),
  contact_name VARCHAR(120),
  contact_phone VARCHAR(20),
  alternate_contact_phone VARCHAR(20),
  medical_condition VARCHAR(255),
  health_notes TEXT,
  required_by_date DATE,
  accepted_donor_id INT NULL,
  accepted_at TIMESTAMP NULL,
  status ENUM('Pending','Completed','Cancelled') DEFAULT 'Pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_donor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS donor_profile (
  user_id INT PRIMARY KEY,
  city VARCHAR(100),
  contact VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Extended user profile information (shared)
CREATE TABLE IF NOT EXISTS user_profile (
  user_id INT PRIMARY KEY,
  role ENUM('donor','receiver','admin') NOT NULL DEFAULT 'receiver',
  phone VARCHAR(20),
  gender ENUM('male','female','other'),
  date_of_birth DATE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(12),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  profile_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Donor specific medical and availability details
CREATE TABLE IF NOT EXISTS donor_details (
  user_id INT PRIMARY KEY,
  weight_kg DECIMAL(5,2),
  last_donation_date DATE,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  preferred_donation_center VARCHAR(150),
  medical_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Receiver specific details
CREATE TABLE IF NOT EXISTS receiver_details (
  user_id INT PRIMARY KEY,
  hospital_name VARCHAR(150),
  doctor_name VARCHAR(100),
  urgency ENUM('low','medium','high','critical') DEFAULT 'medium',
  required_units INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointment booking details
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  purpose ENUM('donation','consultation','screening','other') DEFAULT 'donation',
  status ENUM('booked','confirmed','completed','cancelled') DEFAULT 'booked',
  sms_delivery_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  sms_error VARCHAR(255),
  sms_provider_message_id VARCHAR(140),
  email_delivery_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  email_error VARCHAR(255),
  email_provider_message_id VARCHAR(140),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_appointments_email (email),
  INDEX idx_appointments_datetime (appointment_date, appointment_time),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Contact us / message form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','in_progress','resolved','closed') DEFAULT 'new',
  replied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_email (email),
  INDEX idx_contact_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Newsletter / subscribe feature data
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  full_name VARCHAR(120),
  source_page VARCHAR(100),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  INDEX idx_newsletter_active (is_active)
);

-- App message/notification records between users
CREATE TABLE IF NOT EXISTS user_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_user_id INT NULL,
  receiver_user_id INT NULL,
  subject VARCHAR(180),
  message TEXT NOT NULL,
  message_type ENUM('general','request','appointment','system') DEFAULT 'general',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  INDEX idx_messages_receiver (receiver_user_id, is_read),
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Signup and auth activity tracking
CREATE TABLE IF NOT EXISTS user_auth_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  email VARCHAR(120) NOT NULL,
  event_type ENUM('signup','login_success','login_failed','logout','password_reset') NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_email (email),
  INDEX idx_auth_event_time (event_time),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Delivery logs for email/SMS notifications (reset link, appointment confirmation, etc.)
CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  related_entity_type ENUM('password_reset','appointment') NOT NULL,
  related_entity_id BIGINT NULL,
  channel ENUM('email','sms') NOT NULL,
  recipient VARCHAR(180) NOT NULL,
  template_key VARCHAR(80) NOT NULL,
  subject VARCHAR(180),
  message_preview VARCHAR(255),
  provider VARCHAR(40),
  provider_message_id VARCHAR(140),
  delivery_status ENUM('sent','failed','skipped') NOT NULL,
  error_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_logs_entity (related_entity_type, related_entity_id),
  INDEX idx_notification_logs_status (delivery_status),
  INDEX idx_notification_logs_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

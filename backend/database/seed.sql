USE face_attendance_db;

-- Clear existing data (in reverse order of dependencies)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance_corrections;
TRUNCATE TABLE attendance;
TRUNCATE TABLE attendance_sessions;
TRUNCATE TABLE face_data;
TRUNCATE TABLE faculty;
TRUNCATE TABLE students;
TRUNCATE TABLE users;
TRUNCATE TABLE subjects;
TRUNCATE TABLE courses;
TRUNCATE TABLE departments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics & Communication', 'ECE');

-- 2. Insert Courses
INSERT INTO courses (id, name, code, department_id) VALUES
(1, 'Bachelor of Technology in Computer Science', 'BTech-CSE', 1),
(2, 'Master of Technology in Computer Science', 'MTech-CSE', 1),
(3, 'Bachelor of Technology in Information Tech', 'BTech-IT', 2),
(4, 'Bachelor of Technology in Electronics', 'BTech-ECE', 3);

-- 3. Insert Subjects
INSERT INTO subjects (id, name, code, course_id) VALUES
-- CSE Subjects
(1, 'Artificial Intelligence', 'CS-401', 1),
(2, 'Machine Learning', 'CS-402', 1),
(3, 'Database Management Systems', 'CS-203', 1),
(4, 'Compiler Design', 'CS-302', 1),
-- IT Subjects
(5, 'Web Technologies', 'IT-301', 3),
(6, 'Information Security', 'IT-402', 3),
-- ECE Subjects
(7, 'Digital Signal Processing', 'EC-301', 4);

-- 4. Insert Users (All users have the password: 'password123')
-- Hash: $2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S
INSERT INTO users (id, username, email, password_hash, role) VALUES
-- Admins
(1, 'admin', 'admin@university.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'admin'),
-- Faculty Users
(2, 'prof_sarah', 'sarah.jenkins@university.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'faculty'),
(3, 'prof_robert', 'robert.miller@university.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'faculty'),
-- Student Users
(4, 'student_john', 'john.doe@student.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'student'),
(5, 'student_jane', 'jane.smith@student.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'student'),
(6, 'student_alex', 'alex.jones@student.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'student'),
(7, 'student_emily', 'emily.brown@student.edu', '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S', 'student');

-- 5. Insert Faculty Details
INSERT INTO faculty (id, user_id, employee_id, first_name, last_name, department_id) VALUES
(1, 2, 'EMP202601', 'Sarah', 'Jenkins', 1),
(2, 3, 'EMP202602', 'Robert', 'Miller', 1);

-- 6. Insert Student Details
INSERT INTO students (id, user_id, roll_number, first_name, last_name, department_id, course_id, photo_url) VALUES
(1, 4, 'CSE-2026-001', 'John', 'Doe', 1, 1, '/uploads/students/john_doe.jpg'),
(2, 5, 'CSE-2026-002', 'Jane', 'Smith', 1, 1, '/uploads/students/jane_smith.jpg'),
(3, 6, 'CSE-2026-003', 'Alex', 'Jones', 1, 1, '/uploads/students/alex_jones.jpg'),
(4, 7, 'IT-2026-001', 'Emily', 'Brown', 2, 3, '/uploads/students/emily_brown.jpg');

-- 7. Insert Attendance Sessions (Completed sessions over past 2 days, plus 1 active session)
INSERT INTO attendance_sessions (id, faculty_id, subject_id, date, start_time, end_time, is_active, qr_code_token) VALUES
-- Past Sessions
(1, 1, 1, '2026-05-29', '09:00:00', '10:00:00', FALSE, NULL),
(2, 1, 2, '2026-05-29', '11:00:00', '12:00:00', FALSE, NULL),
(3, 1, 1, '2026-05-30', '09:00:00', '10:00:00', FALSE, NULL),
-- Current Active Session (For Testing live features)
(4, 1, 1, CURDATE(), '09:00:00', '17:00:00', TRUE, 'token_active_qr_code_123');

-- 8. Insert Attendance Records (For CSE Students in past sessions, and some in the active session)
INSERT INTO attendance (session_id, student_id, status, marked_by, verification_score) VALUES
-- Session 1 (AI on May 29)
(1, 1, 'present', 'face_recognition', 0.12),
(1, 2, 'present', 'face_recognition', 0.15),
(1, 3, 'absent', 'manual', NULL),
-- Session 2 (ML on May 29)
(2, 1, 'present', 'face_recognition', 0.18),
(2, 2, 'absent', 'manual', NULL),
(2, 3, 'present', 'manual', NULL),
-- Session 3 (AI on May 30)
(3, 1, 'present', 'face_recognition', 0.11),
(3, 2, 'present', 'face_recognition', 0.14),
(3, 3, 'present', 'face_recognition', 0.22),
-- Active Session 4 (Today)
(4, 1, 'present', 'face_recognition', 0.08),
(4, 2, 'late', 'qr_code', NULL);

-- 9. Insert Correction Requests (Mock correction workflow)
INSERT INTO attendance_corrections (id, attendance_id, reason, status, reviewed_by) VALUES
(1, 3, 'System did not recognize my face due to dark lighting, but I was physically present in the class.', 'pending', NULL),
(2, 5, 'Arrived 10 minutes late due to bus traffic, please change from Absent to Late.', 'approved', 1);

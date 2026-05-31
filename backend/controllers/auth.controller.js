const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_for_attendance_system_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register User (Unified Transactional Endpoint)
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      username,
      email,
      password,
      role,
      // Student details
      rollNumber,
      firstName,
      lastName,
      departmentId,
      courseId,
      // Faculty details
      employeeId
    } = req.body;

    // Validate inputs
    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing primary user parameters.' });
    }

    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Insert Core User Record
    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );
    const userId = userResult.insertId;

    // 2. Insert Profile Data depending on user role
    if (role === 'student') {
      if (!rollNumber || !firstName || !lastName || !departmentId || !courseId) {
        throw new Error('Student profile details are incomplete.');
      }
      await connection.query(
        'INSERT INTO students (user_id, roll_number, first_name, last_name, department_id, course_id) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, rollNumber, firstName, lastName, departmentId, courseId]
      );
    } else if (role === 'faculty') {
      if (!employeeId || !firstName || !lastName || !departmentId) {
        throw new Error('Faculty profile details are incomplete.');
      }
      await connection.query(
        'INSERT INTO faculty (user_id, employee_id, first_name, last_name, department_id) VALUES (?, ?, ?, ?, ?)',
        [userId, employeeId, firstName, lastName, departmentId]
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  } finally {
    connection.release();
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Credentials are required.' });
    }

    // Query database for user
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = users[0];

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Retrieve corresponding profiles if student or faculty
    let profile = null;
    if (user.role === 'student') {
      const [students] = await db.query(
        `SELECT s.*, d.name AS department_name, c.name AS course_name 
         FROM students s
         JOIN departments d ON s.department_id = d.id
         JOIN courses c ON s.course_id = c.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (students.length > 0) profile = students[0];
    } else if (user.role === 'faculty') {
      const [faculties] = await db.query(
        `SELECT f.*, d.name AS department_name 
         FROM faculty f
         JOIN departments d ON f.department_id = d.id
         WHERE f.user_id = ?`,
        [user.id]
      );
      if (faculties.length > 0) profile = faculties[0];
    }

    // Construct Payload
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: profile // includes detailed student/faculty descriptors
    };

    // Sign Token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: profile
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login authentication.' });
  }
};

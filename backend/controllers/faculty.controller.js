const db = require('../config/db');

// List all faculty members
exports.getAllFaculty = async (req, res) => {
  try {
    const [faculty] = await db.query(
      `SELECT f.*, u.email, u.username, d.name AS department_name, d.code AS department_code
       FROM faculty f
       JOIN users u ON f.user_id = u.id
       JOIN departments d ON f.department_id = d.id
       ORDER BY f.id DESC`
    );

    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    console.error('Fetch Faculty Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving faculty profiles.' });
  }
};

// Create a new Class Attendance Session
exports.createClassSession = async (req, res) => {
  try {
    const { facultyId, subjectId, durationMinutes } = req.body;

    if (!facultyId || !subjectId || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Faculty ID, Subject ID, and duration are required.' });
    }

    // Set time boundaries
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const now = new Date();
    const startTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS
    
    const futureDate = new Date(now.getTime() + durationMinutes * 60000);
    const endTimeStr = futureDate.toTimeString().slice(0, 8);

    // Generate unique QR code token for fallback attendance
    const qrCodeToken = 'QR_' + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Disable any active sessions for this subject and faculty to prevent conflicts
    await db.query(
      'UPDATE attendance_sessions SET is_active = FALSE WHERE faculty_id = ? AND subject_id = ? AND is_active = TRUE',
      [facultyId, subjectId]
    );

    // Insert new session
    const [result] = await db.query(
      `INSERT INTO attendance_sessions (faculty_id, subject_id, date, start_time, end_time, is_active, qr_code_token)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [facultyId, subjectId, date, startTimeStr, endTimeStr, qrCodeToken]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance session started successfully!',
      sessionId: result.insertId,
      sessionDetails: {
        id: result.insertId,
        facultyId,
        subjectId,
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        qrCodeToken
      }
    });

  } catch (error) {
    console.error('Create Class Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error planning active class session.' });
  }
};

// Deactivate/Close Class Session
exports.closeClassSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [session] = await db.query('SELECT id FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (session.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    await db.query(
      'UPDATE attendance_sessions SET is_active = FALSE WHERE id = ?',
      [sessionId]
    );

    res.status(200).json({ success: true, message: 'Attendance session closed successfully.' });
  } catch (error) {
    console.error('Close Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error terminating active session.' });
  }
};

// Retrieve Active Session details for a Faculty
exports.getActiveFacultySessions = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [sessions] = await db.query(
      `SELECT s.*, sub.name AS subject_name, sub.code AS subject_code, c.name AS course_name
       FROM attendance_sessions s
       JOIN subjects sub ON s.subject_id = sub.id
       JOIN courses c ON sub.course_id = c.id
       WHERE s.faculty_id = ? AND s.is_active = TRUE`,
      [facultyId]
    );

    res.status(200).json({ success: true, activeSessions: sessions });
  } catch (error) {
    console.error('Fetch Active Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active faculty sessions.' });
  }
};

// Administrative creation additions (helper routes)
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    await db.query('INSERT INTO departments (name, code) VALUES (?, ?)', [name, code]);
    res.status(201).json({ success: true, message: 'Department registered!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, code, departmentId } = req.body;
    await db.query('INSERT INTO courses (name, code, department_id) VALUES (?, ?, ?)', [name, code, departmentId]);
    res.status(201).json({ success: true, message: 'Course registered!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { name, code, courseId } = req.body;
    await db.query('INSERT INTO subjects (name, code, course_id) VALUES (?, ?, ?)', [name, code, courseId]);
    res.status(201).json({ success: true, message: 'Subject registered!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Faculty Profile
exports.deleteFaculty = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [faculty] = await connection.query('SELECT user_id FROM faculty WHERE id = ?', [id]);
    if (faculty.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    await connection.query('DELETE FROM users WHERE id = ?', [faculty[0].user_id]);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Faculty and logins purged successfully.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Server error purging faculty.' });
  } finally {
    connection.release();
  }
};

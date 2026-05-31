const db = require('../config/db');

// Helper function to calculate Euclidean distance between two 128-dimensional float arrays
function calculateEuclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2);
  }
  return Math.sqrt(sum);
}

// 1. Mark Attendance (Direct API)
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, status, markedBy, verificationScore } = req.body;

    if (!sessionId || !studentId) {
      return res.status(400).json({ success: false, message: 'Session ID and Student ID are required.' });
    }

    // Insert or update attendance log (marked present/late)
    // DUPLICATES CONTROL: 'ON DUPLICATE KEY UPDATE' prevents multiple records per student per class session
    await db.query(
      `INSERT INTO attendance (session_id, student_id, status, marked_by, verification_score) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          marked_by = VALUES(marked_by), 
          verification_score = VALUES(verification_score),
          timestamp = CURRENT_TIMESTAMP`,
      [sessionId, studentId, status || 'present', markedBy || 'face_recognition', verificationScore || null]
    );

    // Retrieve student name for visual confirmation popups
    const [students] = await db.query(
      'SELECT first_name, last_name, roll_number FROM students WHERE id = ?',
      [studentId]
    );

    res.status(200).json({
      success: true,
      message: 'Attendance logged successfully!',
      student: students[0]
    });

  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error logging attendance.' });
  }
};

// 2. Hybrid AI Recognition & Mark (Vector Embeddings Processing on Server)
exports.recognizeAndMark = async (req, res) => {
  try {
    const { sessionId, embedding } = req.body;

    if (!sessionId || !embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ success: false, message: 'Session ID and face descriptor vector are required.' });
    }

    // A. Check if the session exists and is active
    const [sessions] = await db.query(
      'SELECT * FROM attendance_sessions WHERE id = ? AND is_active = TRUE',
      [sessionId]
    );
    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'No active attendance session found with this ID.' });
    }
    const session = sessions[0];

    // B. Fetch all students registered in the database who have face embeddings
    const [allFaces] = await db.query(
      `SELECT fd.student_id, fd.embedding, s.first_name, s.last_name, s.roll_number
       FROM face_data fd
       JOIN students s ON fd.student_id = s.id`
    );

    if (allFaces.length === 0) {
      return res.status(404).json({ success: false, message: 'No registered face database templates found.' });
    }

    // C. Perform Euclidean distance matching on the Node.js server
    let bestMatch = null;
    let minDistance = 1.0; // Distance threshold (Standard threshold for Face Recognition is <= 0.6)
    const MATCH_THRESHOLD = 0.6;

    for (const face of allFaces) {
      let registeredEmbedding;
      try {
        registeredEmbedding = typeof face.embedding === 'string' ? JSON.parse(face.embedding) : face.embedding;
      } catch (err) {
        continue;
      }

      const dist = calculateEuclideanDistance(embedding, registeredEmbedding);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = face;
      }
    }

    // D. Check matching threshold
    if (!bestMatch || minDistance > MATCH_THRESHOLD) {
      return res.status(200).json({
        success: false,
        matchFound: false,
        distance: minDistance,
        message: 'Face detected but does not match any registered student database records.'
      });
    }

    // E. Match found! Mark present in the database automatically
    await db.query(
      `INSERT INTO attendance (session_id, student_id, status, marked_by, verification_score)
       VALUES (?, ?, 'present', 'face_recognition', ?)
       ON DUPLICATE KEY UPDATE 
          status = 'present',
          marked_by = 'face_recognition',
          verification_score = VALUES(verification_score),
          timestamp = CURRENT_TIMESTAMP`,
      [sessionId, bestMatch.student_id, minDistance]
    );

    const confidenceScore = Math.max(0, Math.min(100, Math.round((1 - minDistance) * 100)));

    res.status(200).json({
      success: true,
      matchFound: true,
      studentId: bestMatch.student_id,
      distance: minDistance,
      confidence: confidenceScore,
      student: {
        firstName: bestMatch.first_name,
        lastName: bestMatch.last_name,
        rollNumber: bestMatch.roll_number
      },
      message: `Verified: ${bestMatch.first_name} ${bestMatch.last_name} (${confidenceScore}% Confidence)`
    });

  } catch (error) {
    console.error('Vector Match & Mark Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing face descriptor matching.' });
  }
};

// 3. Mark QR-Code Backup Attendance
exports.markByQRCode = async (req, res) => {
  try {
    const { qrCodeToken, studentId } = req.body;

    if (!qrCodeToken || !studentId) {
      return res.status(400).json({ success: false, message: 'QR token and student details are required.' });
    }

    // Match QR token against active session
    const [sessions] = await db.query(
      'SELECT id FROM attendance_sessions WHERE qr_code_token = ? AND is_active = TRUE',
      [qrCodeToken]
    );

    if (sessions.length === 0) {
      return res.status(400).json({ success: false, message: 'QR Code is expired or invalid.' });
    }

    const sessionId = sessions[0].id;

    await db.query(
      `INSERT INTO attendance (session_id, student_id, status, marked_by)
       VALUES (?, ?, 'present', 'qr_code')
       ON DUPLICATE KEY UPDATE status = 'present', marked_by = 'qr_code', timestamp = CURRENT_TIMESTAMP`,
      [sessionId, studentId]
    );

    res.status(200).json({ success: true, message: 'Attendance marked via backup QR scanner!' });

  } catch (error) {
    console.error('QR Mark Error:', error);
    res.status(500).json({ success: false, message: 'Server error marking QR attendance.' });
  }
};

// 4. Retrieve Active Session Attendance Live Roster (Faculty view)
exports.getSessionLiveRoster = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve marked students
    const [markedList] = await db.query(
      `SELECT a.id AS attendance_id, a.status, a.marked_by, a.verification_score, a.timestamp,
              s.id AS student_id, s.first_name, s.last_name, s.roll_number
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.session_id = ?
       ORDER BY a.timestamp DESC`,
      [sessionId]
    );

    res.status(200).json({ success: true, roster: markedList });
  } catch (error) {
    console.error('Fetch live roster error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving class roster.' });
  }
};

// 5. Submit Attendance Correction request (Student view)
exports.submitCorrectionRequest = async (req, res) => {
  try {
    const { attendanceId, reason } = req.body;

    if (!attendanceId || !reason) {
      return res.status(400).json({ success: false, message: 'Attendance ID and correction explanation are required.' });
    }

    // Insert correction
    await db.query(
      'INSERT INTO attendance_corrections (attendance_id, reason, status) VALUES (?, ?, "pending")',
      [attendanceId, reason]
    );

    res.status(201).json({ success: true, message: 'Correction request submitted successfully to faculty!' });
  } catch (error) {
    console.error('Submit Correction Error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting correction.' });
  }
};

// 6. Review Attendance Correction (Faculty view)
exports.reviewCorrectionRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { correctionId } = req.params;
    const { status, facultyId } = req.body; // status: 'approved' or 'rejected'

    if (!status || !facultyId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status and reviewing faculty are required.' });
    }

    // Check correction
    const [corrections] = await connection.query(
      'SELECT c.*, a.student_id, a.session_id FROM attendance_corrections c JOIN attendance a ON c.attendance_id = a.id WHERE c.id = ?',
      [correctionId]
    );

    if (corrections.length === 0) {
      return res.status(404).json({ success: false, message: 'Correction request not found.' });
    }

    const correction = corrections[0];

    // Update correction status
    await connection.query(
      'UPDATE attendance_corrections SET status = ?, reviewed_by = ? WHERE id = ?',
      [status, facultyId, correctionId]
    );

    // If approved, update underlying attendance log status to 'present'
    if (status === 'approved') {
      await connection.query(
        'UPDATE attendance SET status = "present", marked_by = "manual" WHERE id = ?',
        [correction.attendance_id]
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, message: `Correction request ${status} successfully!` });

  } catch (error) {
    await connection.rollback();
    console.error('Review Correction Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing correction review.' });
  } finally {
    connection.release();
  }
};

// 7. Retrieve Pending Correction requests (Faculty dashboard)
exports.getPendingCorrections = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [corrections] = await db.query(
      `SELECT c.*, s.first_name, s.last_name, s.roll_number, sub.name AS subject_name, sess.date
       FROM attendance_corrections c
       JOIN attendance a ON c.attendance_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN attendance_sessions sess ON a.session_id = sess.id
       JOIN subjects sub ON sess.subject_id = sub.id
       WHERE sess.faculty_id = ? AND c.status = 'pending'`,
      [facultyId]
    );

    res.status(200).json({ success: true, corrections });
  } catch (error) {
    console.error('Fetch corrections error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving pending adjustments.' });
  }
};

// 8. Fetch Historical Reports
exports.getAttendanceReport = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate, departmentId } = req.query;
    let query = `
      SELECT a.id AS attendance_id, a.status, a.marked_by, a.timestamp,
             s.first_name, s.last_name, s.roll_number,
             sub.name AS subject_name, sub.code AS subject_code,
             sess.date, sess.start_time
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN attendance_sessions sess ON a.session_id = sess.id
      JOIN subjects sub ON sess.subject_id = sub.id
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      query += ' AND s.id = ?';
      params.push(studentId);
    }
    if (subjectId) {
      query += ' AND sub.id = ?';
      params.push(subjectId);
    }
    if (departmentId) {
      query += ' AND s.department_id = ?';
      params.push(departmentId);
    }
    if (startDate && endDate) {
      query += ' AND sess.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY sess.date DESC, sess.start_time DESC';

    const [reports] = await db.query(query, params);
    res.status(200).json({ success: true, count: reports.length, data: reports });

  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reports.' });
  }
};

const db = require('../config/db');

// 1. Get System Overview Stats (Admin panel)
exports.getSystemOverviewStats = async (req, res) => {
  try {
    const [students] = await db.query('SELECT COUNT(*) AS count FROM students');
    const [faculty] = await db.query('SELECT COUNT(*) AS count FROM faculty');
    const [sessions] = await db.query('SELECT COUNT(*) AS count FROM attendance_sessions WHERE is_active = TRUE');
    const [departments] = await db.query('SELECT COUNT(*) AS count FROM departments');

    // Calculate overall average attendance percentage
    const [attendanceTotal] = await db.query(`
      SELECT 
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
        COUNT(*) AS total_count
      FROM attendance
    `);

    let averageAttendance = 0;
    if (attendanceTotal[0] && attendanceTotal[0].total_count > 0) {
      averageAttendance = Math.round((attendanceTotal[0].present_count / attendanceTotal[0].total_count) * 100);
    }

    res.status(200).json({
      success: true,
      stats: {
        totalStudents: students[0].count,
        totalFaculty: faculty[0].count,
        activeSessions: sessions[0].count,
        totalDepartments: departments[0].count,
        overallAttendanceRate: averageAttendance
      }
    });

  } catch (error) {
    console.error('Fetch System Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving administration statistics.' });
  }
};

// 2. Get Today's Live Attendance Dashboard Card (Faculty & Admin)
exports.getTodayLiveAttendance = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT 
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        COUNT(*) AS total
      FROM attendance a
      JOIN attendance_sessions s ON a.session_id = s.id
      WHERE s.date = CURDATE()
    `);

    const stats = logs[0].total > 0 ? logs[0] : { present: 0, late: 0, absent: 0, total: 0 };
    res.status(200).json({ success: true, stats });

  } catch (error) {
    console.error('Fetch today attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error calculating today attendance.' });
  }
};

// 3. Department-wise Attendance Performance (For Bar Charts)
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const [departments] = await db.query(`
      SELECT 
        d.name AS department_name,
        d.code AS department_code,
        SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
        COUNT(a.id) AS total_count
      FROM departments d
      JOIN students s ON s.department_id = d.id
      LEFT JOIN attendance a ON a.student_id = s.id
      GROUP BY d.id
    `);

    const analytics = departments.map(dept => {
      const percentage = dept.total_count > 0 ? Math.round((dept.present_count / dept.total_count) * 100) : 0;
      return {
        department: dept.department_name,
        code: dept.department_code,
        attendanceRate: percentage
      };
    });

    res.status(200).json({ success: true, data: analytics });

  } catch (error) {
    console.error('Fetch Dept Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error compiling departmental trends.' });
  }
};

// 4. Subject-wise Attendance Performance (For Radar/Line Charts)
exports.getSubjectAnalytics = async (req, res) => {
  try {
    const [subjects] = await db.query(`
      SELECT 
        sub.name AS subject_name,
        sub.code AS subject_code,
        SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
        COUNT(a.id) AS total_count
      FROM subjects sub
      JOIN attendance_sessions sess ON sess.subject_id = sub.id
      LEFT JOIN attendance a ON a.session_id = sess.id
      GROUP BY sub.id
    `);

    const analytics = subjects.map(sub => {
      const percentage = sub.total_count > 0 ? Math.round((sub.present_count / sub.total_count) * 100) : 0;
      return {
        subject: sub.subject_name,
        code: sub.subject_code,
        attendanceRate: percentage
      };
    });

    res.status(200).json({ success: true, data: analytics });

  } catch (error) {
    console.error('Fetch Subject Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error compiling subject-level trends.' });
  }
};

// 5. Individual Student Subject Performance (Student portal dashboard cards)
exports.getStudentSubjectOverview = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch subjects corresponding to student course
    const [student] = await db.query('SELECT course_id FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const courseId = student[0].course_id;

    // Find attendance rates per subject for this course
    const [subjectLogs] = await db.query(`
      SELECT 
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_days,
        COUNT(sess.id) AS total_sessions
      FROM subjects sub
      JOIN attendance_sessions sess ON sess.subject_id = sub.id
      LEFT JOIN attendance a ON a.session_id = sess.id AND a.student_id = ?
      WHERE sub.course_id = ?
      GROUP BY sub.id
    `, [studentId, courseId]);

    const performance = subjectLogs.map(log => {
      const rate = log.total_sessions > 0 ? Math.round((log.present_days / log.total_sessions) * 100) : 0;
      return {
        subjectId: log.subject_id,
        subjectName: log.subject_name,
        subjectCode: log.subject_code,
        attendedClasses: log.present_days,
        totalClasses: log.total_sessions,
        attendanceRate: rate
      };
    });

    res.status(200).json({ success: true, data: performance });

  } catch (error) {
    console.error('Fetch Student performance error:', error);
    res.status(500).json({ success: false, message: 'Server error compiling student report cards.' });
  }
};

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// 1. Mark Attendance endpoints
router.post('/mark', verifyToken, authorizeRoles('admin', 'faculty', 'student'), attendanceController.markAttendance);
router.post('/recognize-and-mark', verifyToken, authorizeRoles('admin', 'faculty'), attendanceController.recognizeAndMark);
router.post('/mark-qr', verifyToken, authorizeRoles('admin', 'faculty', 'student'), attendanceController.markByQRCode);

// 2. Classroom live tracking endpoints
router.get('/session/roster/:sessionId', verifyToken, authorizeRoles('admin', 'faculty'), attendanceController.getSessionLiveRoster);

// 3. Correction requests portal
router.post('/corrections/submit', verifyToken, authorizeRoles('student'), attendanceController.submitCorrectionRequest);
router.get('/corrections/pending/:facultyId', verifyToken, authorizeRoles('admin', 'faculty'), attendanceController.getPendingCorrections);
router.put('/corrections/review/:correctionId', verifyToken, authorizeRoles('admin', 'faculty'), attendanceController.reviewCorrectionRequest);

// 4. Historical reports & PDF summaries
router.get('/reports', verifyToken, authorizeRoles('admin', 'faculty', 'student'), attendanceController.getAttendanceReport);

module.exports = router;

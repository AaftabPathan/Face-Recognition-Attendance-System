const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Protected analytics pathways (Requires JWT)
router.get('/overview', verifyToken, authorizeRoles('admin'), analyticsController.getSystemOverviewStats);
router.get('/live-today', verifyToken, authorizeRoles('admin', 'faculty'), analyticsController.getTodayLiveAttendance);
router.get('/department', verifyToken, authorizeRoles('admin', 'faculty'), analyticsController.getDepartmentAnalytics);
router.get('/subject', verifyToken, authorizeRoles('admin', 'faculty'), analyticsController.getSubjectAnalytics);
router.get('/student/:studentId', verifyToken, authorizeRoles('admin', 'faculty', 'student'), analyticsController.getStudentSubjectOverview);

module.exports = router;

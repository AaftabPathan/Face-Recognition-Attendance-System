const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Core profiles listings
router.get('/', verifyToken, authorizeRoles('admin'), facultyController.getAllFaculty);
router.delete('/:id', verifyToken, authorizeRoles('admin'), facultyController.deleteFaculty);

// Active Classroom Sessions controls
router.post('/session/start', verifyToken, authorizeRoles('admin', 'faculty'), facultyController.createClassSession);
router.put('/session/close/:sessionId', verifyToken, authorizeRoles('admin', 'faculty'), facultyController.closeClassSession);
router.get('/session/active/:facultyId', verifyToken, authorizeRoles('admin', 'faculty'), facultyController.getActiveFacultySessions);

// Metadata admin creation panels
router.post('/meta/department', verifyToken, authorizeRoles('admin'), facultyController.createDepartment);
router.post('/meta/course', verifyToken, authorizeRoles('admin'), facultyController.createCourse);
router.post('/meta/subject', verifyToken, authorizeRoles('admin'), facultyController.createSubject);

module.exports = router;

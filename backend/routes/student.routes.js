const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Fetch dropdown lists (Public/Auth endpoints)
router.get('/meta/lists', studentController.getMetadataLists);

// Protected student records endpoints (Requires JWT)
router.get('/', verifyToken, authorizeRoles('admin', 'faculty'), studentController.getAllStudents);
router.get('/:id', verifyToken, authorizeRoles('admin', 'faculty', 'student'), studentController.getStudentById);

// Administrative records writing endpoints
router.put('/:id', verifyToken, authorizeRoles('admin', 'faculty'), studentController.updateStudent);
router.delete('/:id', verifyToken, authorizeRoles('admin'), studentController.deleteStudent);

// Face template enrollment endpoint
router.post('/register-face', verifyToken, authorizeRoles('admin', 'faculty'), studentController.registerFaceEmbeddings);

module.exports = router;

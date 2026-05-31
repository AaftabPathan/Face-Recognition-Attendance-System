const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT s.*, u.email, u.username, d.name AS department_name, d.code AS department_code, c.name AS course_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments d ON s.department_id = d.id
       JOIN courses c ON s.course_id = c.id
       ORDER BY s.id DESC`
    );

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving students.' });
  }
};

// Get single student by ID
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [students] = await db.query(
      `SELECT s.*, u.email, u.username, d.name AS department_name, c.name AS course_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments d ON s.department_id = d.id
       JOIN courses c ON s.course_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Retrieve corresponding face templates
    const [faces] = await db.query(
      'SELECT id, image_path FROM face_data WHERE student_id = ?',
      [id]
    );

    res.status(200).json({ success: true, data: students[0], enrolledFaces: faces });
  } catch (error) {
    console.error('Fetch Student Detail Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving student details.' });
  }
};

// Update student profile
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, departmentId, courseId } = req.body;

    // Check if student exists
    const [students] = await db.query('SELECT id FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await db.query(
      `UPDATE students 
       SET first_name = ?, last_name = ?, department_id = ?, course_id = ? 
       WHERE id = ?`,
      [firstName, lastName, departmentId, courseId, id]
    );

    res.status(200).json({ success: true, message: 'Student profile updated successfully!' });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating student.' });
  }
};

// Delete student (Cascades will clear users, face_data, and attendance references)
exports.deleteStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Retrieve user_id of student
    const [students] = await connection.query('SELECT user_id, photo_url FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const student = students[0];

    // Delete uploaded files if any exist
    if (student.photo_url) {
      const fullPath = path.join(__dirname, '..', student.photo_url);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Retrieve other facial capture photos to clean up local storage
    const [faces] = await connection.query('SELECT image_path FROM face_data WHERE student_id = ?', [id]);
    faces.forEach(face => {
      if (face.image_path) {
        const fullFacePath = path.join(__dirname, '..', face.image_path);
        if (fs.existsSync(fullFacePath)) {
          fs.unlinkSync(fullFacePath);
        }
      }
    });

    // Delete core user record (cascading constraints delete the student row automatically)
    await connection.query('DELETE FROM users WHERE id = ?', [student.user_id]);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Student and corresponding logins purged successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error purging student.' });
  } finally {
    connection.release();
  }
};

// Save Student Face Data Embeddings (Visual captures integration)
exports.registerFaceEmbeddings = async (req, res) => {
  try {
    const { studentId, embeddings, imageBase64 } = req.body;

    if (!studentId || !embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
      return res.status(400).json({ success: false, message: 'Student ID and embeddings collection are required.' });
    }

    // Validate student existence
    const [studentExists] = await db.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (studentExists.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Optional: Write the snapshot image to local uploads folder
    let relativeImagePath = null;
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `student_face_${studentId}_${Date.now()}.png`;
      const relativeFolder = 'uploads/students';
      const absoluteFolder = path.join(__dirname, '..', relativeFolder);
      
      if (!fs.existsSync(absoluteFolder)) {
        fs.mkdirSync(absoluteFolder, { recursive: true });
      }

      const absolutePath = path.join(absoluteFolder, filename);
      fs.writeFileSync(absolutePath, buffer);
      relativeImagePath = `/${relativeFolder}/${filename}`;
    }

    // Clear any previous face registrations to register a fresh profile template
    await db.query('DELETE FROM face_data WHERE student_id = ?', [studentId]);

    // Insert new registration embedding templates
    // Embeddings are sent as an array of descriptor vectors, we store them as JSON arrays
    const insertPromises = embeddings.map(emb => {
      const stringifiedEmbedding = JSON.stringify(emb); // Embs are float arrays [0.124, -0.05, ...]
      return db.query(
        'INSERT INTO face_data (student_id, embedding, image_path) VALUES (?, ?, ?)',
        [studentId, stringifiedEmbedding, relativeImagePath]
      );
    });

    await Promise.all(insertPromises);

    // Update main photo_url with the registered face thumbnail
    if (relativeImagePath) {
      await db.query('UPDATE students SET photo_url = ? WHERE id = ?', [relativeImagePath, studentId]);
    }

    res.status(200).json({ success: true, message: 'Student facial embeddings registered successfully!' });

  } catch (error) {
    console.error('Register Face Embeddings Error:', error);
    res.status(500).json({ success: false, message: 'Server error logging facial embeddings.' });
  }
};

// Retrieve Metadata Lists (helper dropdown lists for user registers)
exports.getMetadataLists = async (req, res) => {
  try {
    const [departments] = await db.query('SELECT * FROM departments ORDER BY name');
    const [courses] = await db.query('SELECT * FROM courses ORDER BY name');
    const [subjects] = await db.query('SELECT * FROM subjects ORDER BY name');

    res.status(200).json({
      success: true,
      departments,
      courses,
      subjects
    });
  } catch (error) {
    console.error('Fetch Metadata Lists Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving metadata lists.' });
  }
};

import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, isTeacher } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(isTeacher);

// ================= GET STUDENTS BY CLASS =================
router.get('/students/:className', (req, res) => {
  const { className } = req.params;

  const sql = `
    SELECT s.id, s.roll_no, s.class_name, u.id AS userId, u.name, u.email
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.class_name = ?
    ORDER BY s.roll_no ASC
  `;

  db.query(sql, [className], (err, students) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch students' });
    res.json(students);
  });
});

// ================= MARK ATTENDANCE =================
router.post('/attendance', (req, res) => {
  const { subjectId, date, attendanceRecords } = req.body;

  if (!subjectId || !date || !attendanceRecords || attendanceRecords.length === 0) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const values = attendanceRecords.map(r => [r.studentId, subjectId, date, r.status]);

  const sql = `
    INSERT INTO attendance (student_id, subject_id, date, status)
    VALUES ?
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `;

  db.query(sql, [values], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to mark attendance' });
    res.json({ message: 'Attendance marked successfully' });
  });
});

// ================= VIEW ATTENDANCE BY SUBJECT =================
router.get('/attendance/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  const { startDate, endDate } = req.query;

  let sql = `
    SELECT a.*, s.roll_no, u.name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.subject_id = ?
  `;

  const params = [subjectId];

  if (startDate) {
    sql += ' AND a.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND a.date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY a.date DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendance' });
    res.json(results);
  });
});

// ================= SUBJECTS =================
router.get('/subjects', (req, res) => {
  db.query('SELECT * FROM subjects ORDER BY class_name ASC', (err, subjects) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch subjects' });
    res.json(subjects);
  });
});

router.post('/subjects', (req, res) => {
  const { subjectName, className } = req.body;

  if (!subjectName || !className) {
    return res.status(400).json({ error: 'Subject name and class are required' });
  }

  db.query(
    'INSERT INTO subjects (subject_name, class_name) VALUES (?, ?)',
    [subjectName, className],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create subject' });
      res.status(201).json({ id: result.insertId, subject_name: subjectName, class_name: className });
    }
  );
});

// ================= CURRICULUM =================
router.get('/curriculum/:subjectId', (req, res) => {
  db.query(
    'SELECT * FROM curriculum_topics WHERE subject_id = ? ORDER BY id ASC',
    [req.params.subjectId],
    (err, topics) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch curriculum' });
      res.json(topics);
    }
  );
});

router.post('/curriculum', (req, res) => {
  const { subjectId, topicName, status, notes } = req.body;

  db.query(
    'INSERT INTO curriculum_topics (subject_id, topic_name, status, notes) VALUES (?, ?, ?, ?)',
    [subjectId, topicName, status || 'Pending', notes || ''],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create topic' });
      res.status(201).json({ id: result.insertId, subject_id: subjectId, topic_name: topicName, status, notes });
    }
  );
});

router.put('/curriculum/:topicId', (req, res) => {
  const { status, notes } = req.body;

  db.query(
    'UPDATE curriculum_topics SET status = ?, notes = ? WHERE id = ?',
    [status, notes, req.params.topicId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update topic' });
      res.json({ message: 'Topic updated successfully' });
    }
  );
});

// ================= ACTIVITIES =================
router.get('/activities', (req, res) => {
  const { subjectId } = req.query;

  let sql = `
    SELECT a.*, s.subject_name, s.class_name
    FROM activities a
    JOIN subjects s ON a.subject_id = s.id
  `;
  const params = [];

  if (subjectId) {
    sql += ' WHERE a.subject_id = ?';
    params.push(subjectId);
  }

  sql += ' ORDER BY a.date DESC';

  db.query(sql, params, (err, activities) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch activities' });
    res.json(activities);
  });
});

router.post('/activities', (req, res) => {
  const { subjectId, title, type, date } = req.body;

  db.query(
    'INSERT INTO activities (subject_id, title, type, date) VALUES (?, ?, ?, ?)',
    [subjectId, title, type, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create activity' });
      res.status(201).json({ id: result.insertId, subject_id: subjectId, title, type, date });
    }
  );
});

// ================= STUDENT ACTIVITY MARKING =================
router.get('/student-activities/:activityId', (req, res) => {
  const sql = `
    SELECT sa.*, s.roll_no, u.name
    FROM student_activities sa
    JOIN students s ON sa.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE sa.activity_id = ?
  `;

  db.query(sql, [req.params.activityId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch student activities' });
    res.json(results);
  });
});

router.post('/student-activities', (req, res) => {
  const { activityId, studentId, marks, status, remarks } = req.body;

  const sql = `
    INSERT INTO student_activities (activity_id, student_id, marks, status, remarks)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE marks = VALUES(marks), status = VALUES(status), remarks = VALUES(remarks)
  `;

  db.query(sql, [activityId, studentId, marks || null, status || 'Pending', remarks || ''], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update student activity' });
    res.json({ message: 'Student activity updated successfully' });
  });
});

export default router;

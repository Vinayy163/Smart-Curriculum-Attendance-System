import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, isStudent } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(isStudent);


// ================= STUDENT ATTENDANCE =================
router.get('/attendance', (req, res) => {
  const { studentId } = req.user;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID not found' });
  }

  // Get student's class
  db.query('SELECT class_name FROM students WHERE id = ?', [studentId], (err, studentResults) => {
    if (err || studentResults.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const className = studentResults[0].class_name;

    // Get subjects for that class
    db.query('SELECT * FROM subjects WHERE class_name = ?', [className], (err2, subjects) => {
      if (err2) return res.status(500).json({ error: 'Failed to fetch subjects' });

      if (subjects.length === 0) {
        return res.json({ subjects: [], overall: { total: 0, present: 0, absent: 0, percentage: 0 } });
      }

      const attendanceStats = [];
      let processed = 0;

      subjects.forEach(subject => {
        db.query(
          'SELECT status FROM attendance WHERE student_id = ? AND subject_id = ?',
          [studentId, subject.id],
          (err3, attendance) => {
            if (err3) return res.status(500).json({ error: 'Failed to fetch attendance' });

            const total = attendance.length;
            const present = attendance.filter(a => a.status === 'Present').length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

            attendanceStats.push({
              subjectId: subject.id,
              subjectName: subject.subject_name,
              total,
              present,
              absent: total - present,
              percentage: parseFloat(percentage)
            });

            processed++;

            if (processed === subjects.length) {
              const totalClasses = attendanceStats.reduce((sum, s) => sum + s.total, 0);
              const totalPresent = attendanceStats.reduce((sum, s) => sum + s.present, 0);
              const overallPercentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(2) : 0;

              res.json({
                subjects: attendanceStats,
                overall: {
                  total: totalClasses,
                  present: totalPresent,
                  absent: totalClasses - totalPresent,
                  percentage: parseFloat(overallPercentage)
                }
              });
            }
          }
        );
      });
    });
  });
});


// ================= CURRICULUM =================
router.get('/curriculum', (req, res) => {
  const { studentId } = req.user;

  db.query('SELECT class_name FROM students WHERE id = ?', [studentId], (err, studentResults) => {
    if (err || studentResults.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const className = studentResults[0].class_name;

    db.query('SELECT id, subject_name FROM subjects WHERE class_name = ?', [className], (err2, subjects) => {
      if (err2) return res.status(500).json({ error: 'Failed to fetch subjects' });

      if (subjects.length === 0) return res.json([]);

      const curriculumData = [];
      let processed = 0;

      subjects.forEach(subject => {
        db.query(
          'SELECT * FROM curriculum_topics WHERE subject_id = ? ORDER BY id ASC',
          [subject.id],
          (err3, topics) => {
            if (!err3 && topics.length > 0) {
              curriculumData.push({
                subjectId: subject.id,
                subjectName: subject.subject_name,
                topics
              });
            }

            processed++;
            if (processed === subjects.length) {
              res.json(curriculumData);
            }
          }
        );
      });
    });
  });
});


// ================= ACTIVITIES =================
router.get('/activities', (req, res) => {
  const { studentId } = req.user;

  db.query('SELECT class_name FROM students WHERE id = ?', [studentId], (err, studentResults) => {
    if (err || studentResults.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const className = studentResults[0].class_name;

    db.query('SELECT id FROM subjects WHERE class_name = ?', [className], (err2, subjects) => {
      if (err2) return res.status(500).json({ error: 'Failed to fetch subjects' });

      const subjectIds = subjects.map(s => s.id);
      if (subjectIds.length === 0) return res.json([]);

      db.query(
        `SELECT a.*, s.subject_name 
         FROM activities a
         JOIN subjects s ON a.subject_id = s.id
         WHERE a.subject_id IN (?)
         ORDER BY a.date DESC`,
        [subjectIds],
        (err3, activities) => {
          if (err3) return res.status(500).json({ error: 'Failed to fetch activities' });

          if (activities.length === 0) return res.json([]);

          let processed = 0;
          const activitiesWithStatus = [];

          activities.forEach(activity => {
            db.query(
              'SELECT * FROM student_activities WHERE activity_id = ? AND student_id = ?',
              [activity.id, studentId],
              (err4, studentActivity) => {
                const sa = studentActivity[0];

                activitiesWithStatus.push({
                  ...activity,
                  subjectName: activity.subject_name,
                  studentMarks: sa ? sa.marks : null,
                  studentStatus: sa ? sa.status : 'Pending',
                  studentRemarks: sa ? sa.remarks : ''
                });

                processed++;
                if (processed === activities.length) {
                  res.json(activitiesWithStatus);
                }
              }
            );
          });
        }
      );
    });
  });
});

export default router;

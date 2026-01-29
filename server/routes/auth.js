import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();


// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNo, className } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'teacher' && role !== 'student') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'User registration failed' });

          const userId = result.insertId;

          // If student, insert into students table
          if (role === 'student') {
            db.query(
              'INSERT INTO students (user_id, roll_no, class_name) VALUES (?, ?, ?)',
              [userId, rollNo, className],
              (err2) => {
                if (err2) return res.status(500).json({ error: 'Student data save failed' });

                return res.status(201).json({ message: 'User registered successfully', userId });
              }
            );
          } else {
            return res.status(201).json({ message: 'User registered successfully', userId });
          }
        }
      );
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// ================= LOGIN =================
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    db.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, role],
      async (err, results) => {
        if (err || results.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If student, fetch studentId
        if (role === 'student') {
          db.query(
            'SELECT id FROM students WHERE user_id = ?',
            [user.id],
            (err2, studentResults) => {
              if (err2) return res.status(500).json({ error: 'Database error' });

              const studentId = studentResults.length > 0 ? studentResults[0].id : null;

              const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, studentId },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
              );

              return res.json({
                token,
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  studentId
                }
              });
            }
          );
        } else {
          const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;

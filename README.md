📚 Smart Curriculum Activity & Attendance Tracking System

A full-stack web application for schools and colleges to manage attendance, curriculum progress, and student activities.

Built using HTML, CSS, Vanilla JavaScript, Node.js, Express, and MySQL.

🚀 Features
👩‍🏫 Teacher Features

Mark and track student attendance by subject and date

View attendance reports with percentage calculations

Add and manage subjects by class

Create assignments, tests, and projects

Track curriculum topics with status and notes

🎓 Student Features

View overall and subject-wise attendance

Visual alerts when attendance drops below 75%

Track curriculum completion progress

View assignments, tests, and projects with marks and remarks

🛠️ Technology Stack
Layer	Technology
Frontend	HTML, CSS, Vanilla JavaScript
Backend	Node.js + Express
Database	MySQL
Authentication	JWT + Bcrypt
API Style	RESTful APIs
📁 Project Structure
├── server/
│   ├── config/
│   │   └── db.js              # MySQL connection
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teacher.js
│   │   └── student.js
│   └── index.js              # Express app entry
├── public/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── teacher-dashboard.html
│   └── student-dashboard.html
├── .env
├── package.json
└── README.md

🗄️ Database Setup (MySQL)
1️⃣ Create Database
CREATE DATABASE smart_attendance;
USE smart_attendance;

2️⃣ Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('teacher','student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

3️⃣ Students Table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  roll_no VARCHAR(50) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

4️⃣ Subjects Table
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  class_name VARCHAR(50) NOT NULL
);

5️⃣ Attendance Table
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present','Absent') NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (student_id, subject_id, date)
);

6️⃣ Curriculum Topics
CREATE TABLE curriculum_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  topic_name VARCHAR(255) NOT NULL,
  status ENUM('Completed','In Progress','Pending') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

7️⃣ Activities Table
CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('Assignment','Test','Project') NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

8️⃣ Student Activities Table
CREATE TABLE student_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  student_id INT NOT NULL,
  marks INT,
  status ENUM('Completed','Pending') DEFAULT 'Pending',
  remarks TEXT,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (activity_id, student_id)
);

⚙️ How to Run the Project
1️⃣ Install Dependencies
npm install
OR
npm install express mysql2 cors dotenv bcryptjs jsonwebtoken

2️⃣ Configure Environment Variables

Create a .env file in the root:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_attendance
JWT_SECRET=supersecretkey
PORT=3000

3️⃣ Start MySQL Server

Make sure MySQL is running (via terminal).

4️⃣ Run Backend Server
node server/index.js


You should see:

MySQL Connected
Server running on http://localhost:3000

5️⃣ Open in Browser
http://localhost:3000

🔐 Authentication Flow

User registers (Teacher or Student)

Password is hashed using bcrypt

On login, server returns a JWT token

Token is stored in localStorage

All protected API routes verify the token

📡 API Endpoints
Auth

POST /api/auth/register

POST /api/auth/login

Teacher

GET /api/teacher/students/:className

POST /api/teacher/attendance

GET /api/teacher/attendance/:subjectId

GET /api/teacher/subjects

POST /api/teacher/subjects

GET /api/teacher/curriculum/:subjectId

POST /api/teacher/curriculum

PUT /api/teacher/curriculum/:topicId

GET /api/teacher/activities

POST /api/teacher/activities

Student

GET /api/student/attendance

GET /api/student/curriculum

GET /api/student/activities

🧪 Testing Flow

Register as Teacher

Add Subjects

Register as Student in same class

Teacher marks attendance

Student views attendance dashboard

🛡️ Security Features

JWT authentication

Password hashing with bcrypt

Role-based access control

Protected API routes
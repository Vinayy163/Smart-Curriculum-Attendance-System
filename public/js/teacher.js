// ================= AUTH PROTECTION =================
if (!isAuthenticated()) window.location.href = '/';

const user = getCurrentUser();
if (!user || user.role !== 'teacher') window.location.href = '/';

document.getElementById('user-name').textContent = user.name;
document.getElementById('welcome-text').textContent = `Welcome back, ${user.name}!`;

let allSubjects = [];
let currentStudents = [];

// ================= TAB SWITCHING =================
const navTabs = document.querySelectorAll('.nav-tab');
navTabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(tabName) {
  navTabs.forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById(`${tabName}-tab`)?.classList.add('active');

  if (['attendance','curriculum','activities','subjects'].includes(tabName)) loadSubjects();
  if (tabName === 'activities') loadActivities();
  if (tabName === 'subjects') loadAllSubjects();
}

document.getElementById('attendance-date').valueAsDate = new Date();
document.getElementById('activity-date').valueAsDate = new Date();

// ================= LOAD SUBJECTS =================
async function loadSubjects() {
  if (allSubjects.length > 0) return;

  try {
    allSubjects = await apiRequest('/teacher/subjects');

    const subjectSelects = [
      'attendance-subject',
      'view-subject',
      'curriculum-subject',
      'view-curriculum-subject',
      'activity-subject'
    ];

    subjectSelects.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;

      select.innerHTML = '<option value="">Select Subject</option>';
      allSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = `${subject.subject_name} (${subject.class_name})`;
        select.appendChild(option);
      });
    });

  } catch (error) {
    console.error('Subjects load error:', error);
  }
}

// ================= LOAD STUDENTS FOR ATTENDANCE =================
async function loadStudentsForAttendance() {
  const className = document.getElementById('attendance-class').value;
  const subjectId = document.getElementById('attendance-subject').value;
  const date = document.getElementById('attendance-date').value;

  if (!className || !subjectId || !date) return alert('Please fill all fields');

  try {
    const students = await apiRequest(`/teacher/students/${encodeURIComponent(className)}`);
    currentStudents = students;

    const records = await apiRequest(`/teacher/attendance/${subjectId}?startDate=${date}&endDate=${date}`);

    const attendanceMap = {};
    records.forEach(r => attendanceMap[r.student_id] = r.status);

    const container = document.getElementById('students-list');

    if (students.length === 0) {
      container.innerHTML = '<p class="empty-state">No students found in this class.</p>';
      return;
    }

    let html = `<h3>Mark Attendance</h3>
      <table>
        <thead><tr><th>Roll No</th><th>Name</th><th>Status</th></tr></thead>
        <tbody>`;

    students.forEach(s => {
      const status = attendanceMap[s.id] || 'Present';
      html += `
        <tr>
          <td>${s.roll_no || s.rollNo}</td>
          <td>${s.name}</td>
          <td>
            <select class="attendance-status" data-student-id="${s.id}">
              <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
              <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
            </select>
          </td>
        </tr>`;
    });

    html += `</tbody></table>
      <button type="button" class="btn btn-success" style="margin-top:15px;" onclick="saveAttendance()">Save Attendance</button>`;

    container.innerHTML = html;

  } catch (error) {
    alert('Error loading students: ' + error.message);
  }
}

// ================= SAVE ATTENDANCE =================
async function saveAttendance() {
  const subjectId = document.getElementById('attendance-subject').value;
  const date = document.getElementById('attendance-date').value;

  const attendanceRecords = [];
  document.querySelectorAll('.attendance-status').forEach(select => {
    attendanceRecords.push({
      studentId: select.dataset.studentId,
      status: select.value
    });
  });

  try {
    await apiRequest('/teacher/attendance', {
      method: 'POST',
      body: JSON.stringify({ subjectId, date, attendanceRecords })
    });

    alert('Attendance saved successfully!');
  } catch (error) {
    alert('Error saving attendance: ' + error.message);
  }
}

// ================= VIEW ATTENDANCE REPORT =================
document.getElementById('view-attendance-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const subjectId = document.getElementById('view-subject').value;
  if (!subjectId) return alert('Please select a subject');

  const params = new URLSearchParams({
    startDate: document.getElementById('view-start-date').value,
    endDate: document.getElementById('view-end-date').value
  });

  try {
    const records = await apiRequest(`/teacher/attendance/${subjectId}?${params}`);

    const stats = {};
    records.forEach(r => {
      if (!stats[r.student_id]) {
        stats[r.student_id] = { name: r.name, rollNo: r.roll_no, present: 0, total: 0 };
      }
      stats[r.student_id].total++;
      if (r.status === 'Present') stats[r.student_id].present++;
    });

    let html = `<h3>Attendance Summary</h3>
      <table>
        <thead><tr><th>Roll No</th><th>Name</th><th>Present</th><th>Total</th><th>%</th></tr></thead><tbody>`;

    Object.values(stats).forEach(s => {
      const percent = ((s.present / s.total) * 100).toFixed(1);
      html += `<tr>
        <td>${s.rollNo}</td>
        <td>${s.name}</td>
        <td>${s.present}</td>
        <td>${s.total}</td>
        <td>${percent}%</td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('attendance-records').innerHTML = html;

  } catch (error) {
    alert('Error loading records: ' + error.message);
  }
});

// ================= CURRICULUM =================
document.getElementById('curriculum-form').addEventListener('submit', async e => {
  e.preventDefault();

  await apiRequest('/teacher/curriculum', {
    method: 'POST',
    body: JSON.stringify({
      subjectId: document.getElementById('curriculum-subject').value,
      topicName: document.getElementById('topic-name').value,
      status: document.getElementById('topic-status').value,
      notes: document.getElementById('topic-notes').value
    })
  });

  alert('Topic added!');
  e.target.reset();
  loadCurriculum();
});

document.getElementById('view-curriculum-subject').addEventListener('change', loadCurriculum);

async function loadCurriculum() {
  const subjectId = document.getElementById('view-curriculum-subject').value;
  if (!subjectId) return;

  const topics = await apiRequest(`/teacher/curriculum/${subjectId}`);

  let html = '<table><tr><th>Topic</th><th>Status</th><th>Notes</th></tr>';
  topics.forEach(t => {
    html += `<tr><td>${t.topic_name}</td><td>${t.status}</td><td>${t.notes || '-'}</td></tr>`;
  });
  html += '</table>';

  document.getElementById('curriculum-list').innerHTML = html;
}

// ================= ACTIVITIES =================
document.getElementById('activity-form').addEventListener('submit', async e => {
  e.preventDefault();

  await apiRequest('/teacher/activities', {
    method: 'POST',
    body: JSON.stringify({
      subjectId: document.getElementById('activity-subject').value,
      title: document.getElementById('activity-title').value,
      type: document.getElementById('activity-type').value,
      date: document.getElementById('activity-date').value
    })
  });

  alert('Activity created!');
  e.target.reset();
  loadActivities();
});

async function loadActivities() {
  const activities = await apiRequest('/teacher/activities');
  let html = '<table><tr><th>Title</th><th>Type</th><th>Subject</th><th>Date</th></tr>';

  activities.forEach(a => {
    html += `<tr>
      <td>${a.title}</td>
      <td>${a.type}</td>
      <td>${a.subject_name}</td>
      <td>${formatDate(a.date)}</td>
    </tr>`;
  });

  html += '</table>';
  document.getElementById('activities-list').innerHTML = html;
}

// ================= SUBJECTS =================
document.getElementById('subject-form').addEventListener('submit', async e => {
  e.preventDefault();

  await apiRequest('/teacher/subjects', {
    method: 'POST',
    body: JSON.stringify({
      subjectName: document.getElementById('subject-name').value,
      className: document.getElementById('subject-class').value
    })
  });

  alert('Subject added!');
  e.target.reset();
  allSubjects = [];
  loadSubjects();
  loadAllSubjects();
});

async function loadAllSubjects() {
  const subjects = await apiRequest('/teacher/subjects');

  let html = '<table><tr><th>Subject</th><th>Class</th></tr>';
  subjects.forEach(s => {
    html += `<tr><td>${s.subject_name}</td><td>${s.class_name}</td></tr>`;
  });
  html += '</table>';

  document.getElementById('subjects-list').innerHTML = html;
}

// Initial load
loadSubjects();

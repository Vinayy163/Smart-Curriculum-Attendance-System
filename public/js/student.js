// Protect page
if (!isAuthenticated()) window.location.href = '/';

const user = getCurrentUser();
if (!user || user.role !== 'student') window.location.href = '/';

// Set user info
document.getElementById('user-name').textContent = user.name;
document.getElementById('welcome-text').textContent = `Welcome back, ${user.name}!`;

let allActivities = [];
let currentFilter = 'all';

// ================= TAB SWITCHING =================
document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(tabName) {
  document.querySelectorAll('.nav-tab[data-tab]').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById(`${tabName}-tab`)?.classList.add('active');

  if (tabName === 'attendance') loadAttendance();
  if (tabName === 'curriculum') loadCurriculum();
  if (tabName === 'activities') loadActivities();
}

// ================= ATTENDANCE =================
async function loadAttendance() {
  try {
    const data = await apiRequest('/student/attendance');

    const statsContainer = document.getElementById('attendance-stats');
    const listContainer = document.getElementById('subject-attendance-list');

    const overallPercentage = data.overall?.percentage || 0;
    const statusClass =
      overallPercentage < 75 ? 'danger' :
      overallPercentage < 85 ? 'warning' : 'success';

    statsContainer.innerHTML = `
      <div class="stat-card ${statusClass}">
        <h3>Overall Attendance</h3>
        <div class="stat-value">${overallPercentage}%</div>
        <p>${data.overall.present} / ${data.overall.total} classes</p>
      </div>
      <div class="stat-card">
        <h3>Total Classes</h3>
        <div class="stat-value">${data.overall.total}</div>
      </div>
      <div class="stat-card success">
        <h3>Classes Attended</h3>
        <div class="stat-value">${data.overall.present}</div>
      </div>
      <div class="stat-card danger">
        <h3>Classes Missed</h3>
        <div class="stat-value">${data.overall.absent}</div>
      </div>
    `;

    if (!data.subjects || data.subjects.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No attendance records found.</p>';
      return;
    }

    let html = `<table>
      <thead>
        <tr><th>Subject</th><th>Present</th><th>Absent</th><th>Total</th><th>Percentage</th></tr>
      </thead><tbody>`;

    data.subjects.forEach(subject => {
      const progressClass =
        subject.percentage < 75 ? 'low' :
        subject.percentage < 85 ? 'medium' : 'high';

      html += `
        <tr>
          <td><strong>${subject.subjectName}</strong></td>
          <td>${subject.present}</td>
          <td>${subject.absent}</td>
          <td>${subject.total}</td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill ${progressClass}" style="width:${subject.percentage}%">
                ${subject.percentage}%
              </div>
            </div>
            ${subject.percentage < 75 ? '<span style="color:var(--danger-color);font-size:12px;">⚠️ Below 75%</span>' : ''}
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    listContainer.innerHTML = html;

  } catch (error) {
    console.error('Attendance error:', error);
    document.getElementById('attendance-stats').innerHTML =
      '<p class="error-message show">Error loading attendance data</p>';
  }
}

// ================= CURRICULUM =================
async function loadCurriculum() {
  try {
    const data = await apiRequest('/student/curriculum');
    const container = document.getElementById('curriculum-progress');

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="empty-state">No curriculum data available.</p>';
      return;
    }

    let html = '';

    data.forEach(subject => {
      const completed = subject.topics.filter(t => t.status === 'Completed').length;
      const total = subject.topics.length;
      const completionPercentage = total ? Math.round((completed / total) * 100) : 0;

      html += `<div style="margin-bottom:30px;">
        <h3>${subject.subjectName}</h3>
        <div class="progress-bar" style="height:30px;">
          <div class="progress-fill high" style="width:${completionPercentage}%">
            ${completionPercentage}% Complete
          </div>
        </div>
      </div>`;
    });

    container.innerHTML = html;

  } catch (error) {
    console.error('Curriculum error:', error);
    document.getElementById('curriculum-progress').innerHTML =
      '<p class="error-message show">Error loading curriculum data</p>';
  }
}

// ================= ACTIVITIES =================
const activityTabs = document.querySelectorAll('[data-activity-type]');
activityTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activityTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.activityType;
    displayActivities();
  });
});

async function loadActivities() {
  try {
    allActivities = await apiRequest('/student/activities');
    displayActivities();
  } catch (error) {
    console.error('Activities error:', error);
    document.getElementById('activities-list').innerHTML =
      '<p class="error-message show">Error loading activities</p>';
  }
}

function displayActivities() {
  const container = document.getElementById('activities-list');

  const filtered = currentFilter === 'all'
    ? allActivities
    : allActivities.filter(a => a.type === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No activities found.</p>';
    return;
  }

  let html = `<table>
    <thead>
      <tr><th>Title</th><th>Type</th><th>Subject</th><th>Date</th><th>Marks</th><th>Status</th><th>Remarks</th></tr>
    </thead><tbody>`;

  filtered.forEach(a => {
    const statusBadge = a.studentStatus === 'Completed' ? 'badge-success' : 'badge-danger';

    html += `
      <tr>
        <td><strong>${a.title}</strong></td>
        <td>${a.type}</td>
        <td>${a.subjectName}</td>
        <td>${formatDate(a.date)}</td>
        <td>${a.studentMarks ?? '-'}</td>
        <td><span class="badge ${statusBadge}">${a.studentStatus}</span></td>
        <td>${a.studentRemarks || '-'}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Initial load
loadAttendance();

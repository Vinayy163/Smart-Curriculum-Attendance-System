// Redirect if already logged in
if (isAuthenticated()) {
  const user = getCurrentUser();
  if (user?.role === 'teacher') {
    window.location.href = '/teacher-dashboard.html';
  } else if (user?.role === 'student') {
    window.location.href = '/student-dashboard.html';
  }
}

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const loginFormContainer = document.getElementById('login-form');
const registerFormContainer = document.getElementById('register-form');
const registerRoleSelect = document.getElementById('register-role');
const studentFields = document.getElementById('student-fields');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    loginFormContainer.classList.toggle('active', tab === 'login');
    registerFormContainer.classList.toggle('active', tab === 'register');
  });
});

// Show/Hide student fields
registerRoleSelect.addEventListener('change', (e) => {
  const isStudent = e.target.value === 'student';
  studentFields.style.display = isStudent ? 'block' : 'none';

  document.getElementById('register-rollno').required = isStudent;
  document.getElementById('register-class').required = isStudent;
});

// ================= LOGIN =================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const role = document.getElementById('login-role').value;

  if (!role) return showError('login-error', 'Please select a role');

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = role === 'teacher'
      ? '/teacher-dashboard.html'
      : '/student-dashboard.html';

  } catch (error) {
    showError('login-error', error.message || 'Login failed');
  }
});

// ================= REGISTER =================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const role = document.getElementById('register-role').value;

  if (!role) return showError('register-error', 'Please select a role');

  const payload = { name, email, password, role };

  if (role === 'student') {
    payload.rollNo = document.getElementById('register-rollno').value.trim();
    payload.className = document.getElementById('register-class').value.trim();
  }

  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Switch to login tab
    tabBtns[0].click();

    document.getElementById('registerForm').reset();
    studentFields.style.display = 'none';

    const loginError = document.getElementById('login-error');
    loginError.textContent = 'Registration successful! Please login.';
    loginError.style.color = 'var(--success-color)';
    loginError.classList.add('show');

  } catch (error) {
    showError('register-error', error.message || 'Registration failed');
  }
});

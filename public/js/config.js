const API_BASE_URL = window.location.origin + '/api';

// ================= AUTH HEADER =================
const getAuthHeader = () => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// ================= GLOBAL API ERROR HANDLER =================
const handleApiError = (error) => {
  console.error('API Error:', error.message);

  if (
    error.message === 'Invalid or expired token' ||
    error.message === 'Access token required'
  ) {
    localStorage.clear();
    window.location.href = '/';
  }

  return error;
};

// ================= API REQUEST WRAPPER =================
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeader(),
        ...(options.headers || {})
      }
    });

    // Handle empty responses safely
    let data = {};
    const text = await response.text();
    if (text) data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ================= AUTH HELPERS =================
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const logout = () => {
  localStorage.clear();
  window.location.href = '/';
};

// ================= UTILITIES =================
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ================= UI MESSAGES =================
const showError = (elementId, message) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.style.color = 'var(--danger-color)';
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
};

const showSuccess = (elementId, message) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.style.color = 'var(--success-color)';
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, 3000);
};

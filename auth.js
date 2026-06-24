// auth.js — handles both register.html and login.html
// Expects backend endpoints:
//   POST /api/auth/register   { username, email, password }
//   POST /api/auth/login      { email, password }
// Login response expected to include a token: { token: "...", user: {...} }

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  initPasswordToggles();
});

/* ── Password show/hide toggle ─────────────────── */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';

      btn.innerHTML = isHidden
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });
}

/* ── Helpers ────────────────────────────────────── */
function showFieldError(groupId, show) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('has-error', show);
}

function clearAllErrors(formEl) {
  formEl.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
}

function showBanner(message, type = 'error') {
  const banner = document.getElementById('form-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.className = `form-banner ${type} show`;
}

function hideBanner() {
  const banner = document.getElementById('form-banner');
  if (banner) banner.className = 'form-banner';
}

function setLoading(isLoading) {
  const btn = document.getElementById('submit-btn');
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Please wait...' : btn.dataset.originalText || btn.textContent;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
}

/* ── Register ───────────────────────────────────── */
async function handleRegister(e) {
  e.preventDefault();
  hideBanner();
  clearAllErrors(e.target);

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  let valid = true;

  if (username.length < 3) {
    showFieldError('group-username', true);
    valid = false;
  }

  if (!isValidEmail(email)) {
    showFieldError('group-email', true);
    valid = false;
  }

  if (password.length < 6) {
    showFieldError('group-password', true);
    valid = false;
  }

  if (password !== confirmPassword) {
    showFieldError('group-confirm', true);
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showBanner(data.message || 'Registration failed. Please try again.', 'error');
      setLoading(false);
      return;
    }

    // Do NOT redirect to login — they must verify their email first.
    // Hide the form and show a "check your email" message instead.
    showVerifyPendingMessage(email);

  } catch (err) {
    console.error(err);
    showBanner('Could not reach the server. Is the backend running?', 'error');
    setLoading(false);
  }
}

/* ── Show "check your email" state after registering ── */
function showVerifyPendingMessage(email) {
  const formBox = document.querySelector('.auth-form-box');
  if (!formBox) return;

  formBox.innerHTML = `
    <div class="verify-pending">
      <div class="verify-icon">✉️</div>
      <h1>Check your email</h1>
      <p class="subtitle">
        We've sent a verification link to<br><strong>${email}</strong>.
        Click the link to activate your account before logging in.
      </p>
      <p class="verify-note">Didn't get it? Check your spam folder, or wait a minute and refresh.</p>
      <a href="login.html" class="auth-switch-link">Back to login</a>
    </div>
  `;
}

/* ── Login ──────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  hideBanner();
  clearAllErrors(e.target);

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let valid = true;

  if (!isValidEmail(email)) {
    showFieldError('group-email', true);
    valid = false;
  }

  if (password.length === 0) {
    showFieldError('group-password', true);
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Backend should respond 403 with a message like "Please verify your email first."
      showBanner(data.message || 'Invalid email or password.', 'error');
      setLoading(false);
      return;
    }

    // Save token + user info so other pages can check login status
    localStorage.setItem('hostelhub_token', data.token);
    localStorage.setItem('hostelhub_user', JSON.stringify(data.user || {}));

    window.location.href = 'index.html';

  } catch (err) {
    console.error(err);
    showBanner('Could not reach the server. Is the backend running?', 'error');
    setLoading(false);
  }
}

/* ── Validation helper ──────────────────────────── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

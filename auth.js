const supabaseAuth = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

// Boolean flags
let isSignUp = true;       // Are we in "Sign Up" mode or "Log In" mode?
let loginWithCode = false; // Are we using code or password for Log In?

// Grab elements from the DOM
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const authSubmit = document.getElementById('auth-submit');

// Sections for password vs. code
const passwordSection = document.getElementById('password-section');
const codeSection = document.getElementById('code-section');

// The login-mode container + link
const toggleLoginModeContainer = document.getElementById('toggle-login-mode');
const loginModeLink = document.getElementById('login-mode-link');

// If these elements are missing, they’ll be null
// so we wrap references in checks

// Show/hide the “log in mode” container
function showLoginModeContainer() {
  if (toggleLoginModeContainer) {
    toggleLoginModeContainer.style.display = 'block';
  }
}
function hideLoginModeContainer() {
  if (toggleLoginModeContainer) {
    toggleLoginModeContainer.style.display = 'none';
  }
}

// Switch between Sign Up and Log In
toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  if (isSignUp) {
    authTitle.innerText = 'Sign Up';
    authSubmit.innerText = 'Create Account';
    toggleAuth.innerText = 'Already have an account? Log in';

    // For sign up, we never show code-based login
    loginWithCode = false;
    hideLoginModeContainer();

    // Show password, hide code
    if (passwordSection) passwordSection.style.display = 'block';
    if (codeSection) codeSection.style.display = 'none';

  } else {
    authTitle.innerText = 'Log In';
    authSubmit.innerText = 'Log In';
    toggleAuth.innerText = 'Don\'t have an account? Sign up';

    // Let them choose code or password
    showLoginModeContainer();
    loginWithCode = false;

    // Default to password mode for login
    if (loginModeLink) loginModeLink.innerText = 'Code';

    // Show password, hide code
    if (passwordSection) passwordSection.style.display = 'block';
    if (codeSection) codeSection.style.display = 'none';
  }
});

// Switch between “Password” and “Code” login, only for “Log In”
if (loginModeLink) {
  loginModeLink.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (isSignUp) return; // Not relevant in sign-up mode

    // Toggle code vs. password
    loginWithCode = !loginWithCode;
    if (loginWithCode) {
      // "Log in with Code" mode
      loginModeLink.innerText = 'Password';
      authSubmit.innerText = 'Log In with Code';
      if (passwordSection) passwordSection.style.display = 'none';
      if (codeSection) codeSection.style.display = 'block';
    } else {
      // "Log in with Password" mode
      loginModeLink.innerText = 'Code';
      authSubmit.innerText = 'Log In';
      if (passwordSection) passwordSection.style.display = 'block';
      if (codeSection) codeSection.style.display = 'none';
    }
  });
}

// Naive password checks
const passwordChecks = document.getElementById('password-checks');
const passwordField = document.getElementById('password');
if (passwordField && passwordChecks) {
  passwordField.addEventListener('input', () => {
    const val = passwordField.value;
    const checks = passwordChecks.getElementsByTagName('li');
    checks[0].textContent = val.length >= 8 ? '✅ At least 8 characters' : '❌ At least 8 characters';
    checks[1].textContent = /[A-Z]/.test(val) ? '✅ 1 uppercase letter' : '❌ 1 uppercase letter';
    checks[2].textContent = /[a-z]/.test(val) ? '✅ 1 lowercase letter' : '❌ 1 lowercase letter';
    checks[3].textContent = /\d/.test(val) ? '✅ 1 number' : '❌ 1 number';
    checks[4].textContent = /[^A-Za-z0-9]/.test(val) ? '✅ 1 symbol' : '❌ 1 symbol';
  });
}

// Toggle password visibility
const togglePassword = document.getElementById('toggle-password');
if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    if (!passwordField) return;
    passwordField.type = (passwordField.type === 'password') ? 'text' : 'password';
  });
}

// Form submit logic
authForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const email = document.getElementById('email').value;

  if (isSignUp) {
    // ---- SIGN UP FLOW ----
    const passVal = passwordField ? passwordField.value : '';
    // Example: create Supabase user
    const { data, error } = await supabaseAuth.auth.signUp({ email, password: passVal });
    if (error) {
      alert('Sign Up Error: ' + error.message);
    } else {
      alert('Sign Up successful! Check your email for confirmation.');
      // Possibly redirect or handle user row creation
    }
  } else {
    // ---- LOG IN FLOW ----
    if (loginWithCode) {
      // Code-based login
      const codeVal = document.getElementById('code-input').value;
      // 1) fetch user by email
      const { data: userRec, error: userErr } = await supabaseAuth
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (!userRec) {
        alert('No user found with that email.');
        return;
      }
      // 2) compare code
      if (userRec.login_code === codeVal) {
        // store session, or do your own logic
        sessionStorage.setItem('impersonateUsername', userRec.username);
        alert('Code login successful! Proceed to Dashboard.');
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid code. Please try again.');
      }
    } else {
      // Password-based login
      const passVal = passwordField ? passwordField.value : '';
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password: passVal
      });
      if (error) {
        alert('Log In Error: ' + error.message);
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  }
});

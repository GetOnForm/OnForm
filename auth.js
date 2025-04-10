const supabaseAuth = supabase.createClient('YOUR_SUPABASE_URL','YOUR_SUPABASE_ANON_KEY');

// Identify DOM elements
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const authSubmit = document.getElementById('auth-submit');
const passwordSection = document.querySelector('.password-wrapper');
const toggleLoginModeContainer = document.getElementById('toggle-login-mode');  // IMPORTANT
const loginModeLink = document.getElementById('login-mode-link');

let isSignUp = true;
let loginWithCode = false;

// Safely handle the container's style
function hideLoginModeContainer() {
  if (toggleLoginModeContainer) {
    toggleLoginModeContainer.style.display = 'none';
  }
}
function showLoginModeContainer() {
  if (toggleLoginModeContainer) {
    toggleLoginModeContainer.style.display = 'block';
  }
}

// Toggle between Sign Up and Log In
toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  if (isSignUp) {
    authTitle.innerText = 'Sign Up';
    authSubmit.innerText = 'Create Account';
    toggleAuth.innerText = 'Already have an account? Log in';
    hideLoginModeContainer(); // no code-based login for sign up
  } else {
    authTitle.innerText = 'Log In';
    authSubmit.innerText = 'Log In';
    toggleAuth.innerText = 'Don\'t have an account? Sign up';
    showLoginModeContainer(); // let them pick code or password
    loginWithCode = false;
    if (loginModeLink) loginModeLink.innerText = 'Code';
  }
});

// Let them toggle code-based login if in Log In mode
if (loginModeLink) {
  loginModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (isSignUp) return; // only relevant in log in mode
    loginWithCode = !loginWithCode;
    if (loginWithCode) {
      loginModeLink.innerText = 'Password';
      authSubmit.innerText = 'Log In with Code';
      // Hide the password wrapper
      passwordSection.style.display = 'none';
      // Show some code input if you had it
    } else {
      loginModeLink.innerText = 'Code';
      authSubmit.innerText = 'Log In';
      passwordSection.style.display = 'block';
      // Hide code input
    }
  });
}

// Demo password checks
const passwordChecks = document.getElementById('password-checks');
const passwordField = document.getElementById('password');
if (passwordField) {
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

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isSignUp) {
    // sign up logic
    console.log('Signing up...');
  } else {
    if (loginWithCode) {
      console.log('Logging in with code...');
    } else {
      console.log('Logging in with password...');
    }
  }
});

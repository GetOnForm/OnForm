const supabaseAuth = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let isSignUp = true;          // Are we in "Sign Up" mode or "Log In" mode?
let loginWithCode = false;    // Are we logging in with code or password?

// Elements
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const authSubmit = document.getElementById('auth-submit');
const passwordSection = document.getElementById('password-section');
const codeSection = document.getElementById('code-section');
const toggleLoginModeLink = document.getElementById('login-mode-link');
const toggleLoginModeContainer = document.getElementById('toggle-login-mode');

// Toggling between Sign Up and Log In
toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;

  if (isSignUp) {
    authTitle.innerText = 'Sign Up';
    authSubmit.innerText = 'Create Account';
    toggleAuth.innerText = 'Already have an account? Log in';
    toggleLoginModeContainer.style.display = 'none'; // hide code/password toggle for sign up
    passwordSection.style.display = 'block';
    codeSection.style.display = 'none';
    loginWithCode = false; // sign up always uses password
  } else {
    authTitle.innerText = 'Log In';
    authSubmit.innerText = 'Log In';
    toggleAuth.innerText = 'Don\'t have an account? Sign up';
    toggleLoginModeContainer.style.display = 'block'; // show link to switch between code/password
    // default to password login
    passwordSection.style.display = 'block';
    codeSection.style.display = 'none';
    loginWithCode = false;
  }
});

// Toggling password vs code for log in
toggleLoginModeLink.addEventListener('click', (e) => {
  e.preventDefault();
  // only valid if isSignUp = false
  loginWithCode = !loginWithCode;
  if (loginWithCode) {
    toggleLoginModeLink.innerText = 'Password';
    passwordSection.style.display = 'none';
    codeSection.style.display = 'block';
    authSubmit.innerText = 'Log In with Code';
  } else {
    toggleLoginModeLink.innerText = 'Code';
    passwordSection.style.display = 'block';
    codeSection.style.display = 'none';
    authSubmit.innerText = 'Log In';
  }
});

// Toggle password visibility
document.getElementById('toggle-password').addEventListener('click', () => {
  const pwdField = document.getElementById('password');
  pwdField.type = pwdField.type === 'password' ? 'text' : 'password';
});

// Very naive password checks
const passwordChecks = document.getElementById('password-checks');
const passwordField = document.getElementById('password');
passwordField.addEventListener('input', () => {
  const val = passwordField.value;
  const checks = passwordChecks.getElementsByTagName('li');
  checks[0].textContent = val.length >= 8 ? '✅ At least 8 characters' : '❌ At least 8 characters';
  checks[1].textContent = /[A-Z]/.test(val) ? '✅ 1 uppercase letter' : '❌ 1 uppercase letter';
  checks[2].textContent = /[a-z]/.test(val) ? '✅ 1 lowercase letter' : '❌ 1 lowercase letter';
  checks[3].textContent = /\d/.test(val) ? '✅ 1 number' : '❌ 1 number';
  checks[4].textContent = /[^A-Za-z0-9]/.test(val) ? '✅ 1 symbol' : '❌ 1 symbol';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  if (isSignUp) {
    // ---------- SIGN UP FLOW ------------
    // Must use a valid password
    const password = document.getElementById('password').value;
    const { data, error } = await supabaseAuth.auth.signUp({ email, password });
    if (error) {
      alert('Sign Up Error: ' + error.message);
    } else {
      alert('Sign Up successful! Check your email for confirmation.');
      // Optionally create row in "users" table after the user confirms email
      // Supabase can do "auth.user" or a webhook to store in the 'users' table
    }

  } else {
    // ---------- LOG IN FLOW ------------
    if (loginWithCode) {
      // Code-based login
      const codeVal = document.getElementById('login-code').value;
      // 1. fetch user by email
      const { data: userRec, error: userError } = await supabaseAuth
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (!userRec) {
        alert('No user found with that email.');
        return;
      }
      // 2. compare code
      if (userRec.login_code === codeVal) {
        // Mark user as "logged in" with supabase in a minimal sense,
        // but normally you'd do a real supabase auth signIn, or store session yourself
        // For an MVP, we might skip the real supabase.auth signIn and just store impersonation
        sessionStorage.setItem('impersonateUsername', userRec.username);
        alert('Code login successful. Head to Dashboard.');
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid code. Please try again.');
      }

    } else {
      // Password-based login
      const password = document.getElementById('password').value;
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Log In Error: ' + error.message);
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  }
});

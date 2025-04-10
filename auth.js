const supabaseAuth = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let isSignUp = true;
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const authSubmit = document.getElementById('auth-submit');

toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  authTitle.innerText = isSignUp ? 'Sign Up' : 'Log In';
  authSubmit.innerText = isSignUp ? 'Create Account' : 'Log In';
  toggleAuth.innerText = isSignUp 
    ? 'Already have an account? Log in' 
    : 'Don\'t have an account? Sign up';
});

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
  const password = document.getElementById('password').value;

  if (isSignUp) {
    // Sign up via Supabase
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password
    });
    if (error) {
      alert('Sign Up Error: ' + error.message);
    } else {
      alert('Sign Up successful! Check your email for confirmation.');
      // optionally create user row in 'users' table after confirmation
    }
  } else {
    // Log in
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      alert('Log In Error: ' + error.message);
    } else {
      window.location.href = 'dashboard.html';
    }
  }
});

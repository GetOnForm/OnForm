const supabaseAuth = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let isSignUp = true;
let loginWithCode = false;

const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const authSubmit = document.getElementById('auth-submit');
const passwordSection = document.getElementById('password-section');
const codeSection = document.getElementById('code-section');
const toggleLoginModeContainer = document.getElementById('toggle-login-mode');
const loginModeLink = document.getElementById('login-mode-link');

const passwordChecks = document.getElementById('password-checks');
const passwordField = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');

function hide(el) {
  if (el) el.style.display = 'none';
}
function show(el) {
  if (el) el.style.display = 'block';
}

function handleModeSwitch() {
  if (isSignUp) {
    authTitle.innerText = 'Sign Up';
    authSubmit.innerText = 'Create Account';
    toggleAuth.innerText = 'Already have an account? Log in';
    hide(toggleLoginModeContainer);

    show(passwordSection);
    hide(codeSection);
    passwordField.required = true;
  } else {
    authTitle.innerText = 'Log In';
    authSubmit.innerText = 'Log In';
    toggleAuth.innerText = 'Don\'t have an account? Sign up';
    show(toggleLoginModeContainer);

    show(passwordSection);
    hide(codeSection);
    passwordField.required = true;
    loginWithCode = false;
    if (loginModeLink) loginModeLink.innerText = 'Code';
  }
}

toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  handleModeSwitch();
});

if (loginModeLink) {
  loginModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (isSignUp) return;
    loginWithCode = !loginWithCode;
    if (loginWithCode) {
      loginModeLink.innerText = 'Password';
      authSubmit.innerText = 'Log In with Code';
      hide(passwordSection);
      show(codeSection);
      passwordField.required = false;
    } else {
      loginModeLink.innerText = 'Code';
      authSubmit.innerText = 'Log In';
      show(passwordSection);
      hide(codeSection);
      passwordField.required = true;
    }
  });
}

if (togglePassword && passwordField) {
  togglePassword.addEventListener('click', () => {
    passwordField.type = (passwordField.type === 'password') ? 'text' : 'password';
  });
}

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

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailVal = document.getElementById('email').value;

  if (isSignUp) {
    const passVal = passwordField.value;
    const { data, error } = await supabaseAuth.auth.signUp({
      email: emailVal,
      password: passVal
    });
    if (error) {
      alert('Sign Up Error: ' + error.message);
    } else {
      alert('Sign Up successful! Check your email for confirmation.');
    }
  } else {
    if (loginWithCode) {
      const codeVal = document.getElementById('code-input').value;
      const { data: userRec } = await supabaseAuth
        .from('users')
        .select('*')
        .eq('email', emailVal)
        .single();
      if (!userRec) return alert('No user found with that email.');

      if (userRec.login_code === codeVal) {
        sessionStorage.setItem('impersonateUsername', userRec.username);
        alert('Code login successful!');
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid code. Please try again.');
      }
    } else {
      const passVal = passwordField.value;
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: emailVal,
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

handleModeSwitch(); // initial

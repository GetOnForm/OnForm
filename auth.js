//---------------------------------------------------
// Supabase Client
//---------------------------------------------------
const supabaseAuth = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

//---------------------------------------------------
// State Flags
//---------------------------------------------------
let isSignUp = true;      // "Sign Up" vs. "Log In"
let loginWithCode = false; // "Password Login" vs. "Code Login"

//---------------------------------------------------
// Element References
//---------------------------------------------------
const authTitle   = document.getElementById('auth-title');
const authForm    = document.getElementById('auth-form');
const toggleAuth  = document.getElementById('toggle-auth');
const authSubmit  = document.getElementById('auth-submit');

// Sections: password vs. code
const passwordSection = document.getElementById('password-section');
const codeSection     = document.getElementById('code-section');

// Toggling password vs. code link
const toggleLoginModeContainer = document.getElementById('toggle-login-mode');
const loginModeLink            = document.getElementById('login-mode-link');

// Password checks
const passwordField  = document.getElementById('password');
const passwordChecks = document.getElementById('password-checks');
const togglePassword = document.getElementById('toggle-password');

//---------------------------------------------------
// Helper: Show/Hide Elements
//---------------------------------------------------
function show(el) {
  if (el) el.style.display = 'block';
}
function hide(el) {
  if (el) el.style.display = 'none';
}

// Hide or show the “toggle-login-mode” container
function showLoginModeContainer() {
  show(toggleLoginModeContainer);
}
function hideLoginModeContainer() {
  hide(toggleLoginModeContainer);
}

//---------------------------------------------------
// Toggle between SIGN UP and LOG IN
//---------------------------------------------------
toggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  if (isSignUp) {
    // Switch to Sign Up
    authTitle.innerText   = 'Sign Up';
    authSubmit.innerText  = 'Create Account';
    toggleAuth.innerText  = 'Already have an account? Log in';

    // Hide code login toggles
    hideLoginModeContainer();
    loginWithCode = false;

    // Show password, hide code
    show(passwordSection);
    hide(codeSection);

    // Re-add required to password field if removed
    if (passwordField) {
      passwordField.required = true;
    }

  } else {
    // Switch to Log In
    authTitle.innerText   = 'Log In';
    authSubmit.innerText  = 'Log In';
    toggleAuth.innerText  = 'Don\'t have an account? Sign up';

    // Let them pick code or password
    showLoginModeContainer();
    loginWithCode = false; // default to password

    // Show password, hide code
    show(passwordSection);
    hide(codeSection);

    // Update link text
    if (loginModeLink) loginModeLink.innerText = 'Code';
    // Re-add required to password if we just toggled away from code earlier
    if (passwordField) {
      passwordField.required = true;
    }
  }
});

//---------------------------------------------------
// Toggle between PASSWORD and CODE (Log In Only)
//---------------------------------------------------
if (loginModeLink) {
  loginModeLink.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (isSignUp) return; // irrelevant in sign-up mode

    loginWithCode = !loginWithCode;
    if (loginWithCode) {
      // Switch to Code login
      loginModeLink.innerText = 'Password';
      authSubmit.innerText    = 'Log In with Code';

      // Hide password section, show code
      hide(passwordSection);
      show(codeSection);

      // Remove "required" from password to avoid "not focusable" error
      if (passwordField) {
        passwordField.required = false;
        passwordField.value    = ''; // Clear it, optional
      }

    } else {
      // Switch back to Password login
      loginModeLink.innerText = 'Code';
      authSubmit.innerText    = 'Log In';

      show(passwordSection);
      hide(codeSection);

      // Re-add required
      if (passwordField) {
        passwordField.required = true;
        passwordField.value    = ''; // optional
      }
    }
  });
}

//---------------------------------------------------
// Toggle Password Visibility
//---------------------------------------------------
if (togglePassword && passwordField) {
  togglePassword.addEventListener('click', () => {
    passwordField.type = (passwordField.type === 'password') ? 'text' : 'password';
  });
}

//---------------------------------------------------
// Password Complexity Checks
//---------------------------------------------------
if (passwordField && passwordChecks) {
  passwordField.addEventListener('input', () => {
    const val = passwordField.value;
    const items = passwordChecks.getElementsByTagName('li');
    items[0].textContent = val.length >= 8           ? '✅ At least 8 characters'   : '❌ At least 8 characters';
    items[1].textContent = /[A-Z]/.test(val)         ? '✅ 1 uppercase letter'      : '❌ 1 uppercase letter';
    items[2].textContent = /[a-z]/.test(val)         ? '✅ 1 lowercase letter'      : '❌ 1 lowercase letter';
    items[3].textContent = /\d/.test(val)            ? '✅ 1 number'                : '❌ 1 number';
    items[4].textContent = /[^A-Za-z0-9]/.test(val)  ? '✅ 1 symbol'                : '❌ 1 symbol';
  });
}

//---------------------------------------------------
// Form Submit
//---------------------------------------------------
authForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const emailVal = document.getElementById('email').value || '';
  
  if (isSignUp) {
    //----------- SIGN UP FLOW -----------
    const passVal = passwordField ? passwordField.value : '';
    // Example: create user in supabase
    const { data, error } = await supabaseAuth.auth.signUp({ email: emailVal, password: passVal });
    if (error) {
      alert('Sign Up Error: ' + error.message);
    } else {
      alert('Sign Up successful! Check your email for confirmation.');
      // Possibly create row in "users" table after user verifies email
    }

  } else {
    //----------- LOG IN FLOW -----------
    if (loginWithCode) {
      // Code-based login
      const codeInput = document.getElementById('code-input');
      const codeVal   = codeInput ? codeInput.value : '';

      // 1) Find user by email
      const { data: userRec, error: userErr } = await supabaseAuth
        .from('users')
        .select('*')
        .eq('email', emailVal)
        .single();
      if (!userRec) {
        alert('No user found with that email.');
        return;
      }
      // 2) Compare code
      if (userRec.login_code === codeVal) {
        // Example "log in"
        sessionStorage.setItem('impersonateUsername', userRec.username);
        alert('Code login successful. Go to Dashboard.');
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid code!');
      }

    } else {
      // Password login
      const passVal = passwordField ? passwordField.value : '';
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

const supabaseClient = supabase.createClient(
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
  toggleAuth.innerText = isSignUp ? 'Already have an account? Log in' : 'Don\'t have an account? Sign up';
});

document.getElementById('toggle-password').addEventListener('click', () => {
  const pwdField = document.getElementById('password');
  pwdField.type = pwdField.type === 'password' ? 'text' : 'password';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (isSignUp) {
    const { user, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert('Sign Up Error: ' + error.message);
    else alert('Sign Up successful! Check your email for confirmation.');
  } else {
    const { user, error } = await supabaseClient.auth.signIn({ email, password });
    if (error) alert('Log In Error: ' + error.message);
    else window.location.href = 'dashboard.html';
  }
});

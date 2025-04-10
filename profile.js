const supabaseProfile = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentProfileUser = null;
let codeVisible = false;

async function fetchProfileUser() {
  const { data: sessionData } = await supabaseProfile.auth.getSession();
  if (sessionData?.session?.user) {
    const userEmail = sessionData.session.user.email;
    if (userEmail) {
      const { data: userRec } = await supabaseProfile
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
      if (userRec) return userRec;
    }
  }
  // Check impersonation
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data, error } = await supabaseProfile
      .from('users')
      .select('*')
      .eq('username', impersonate)
      .single();
    if (data) return data;
  }
  return null;
}

function renderProfile() {
  if (!currentProfileUser) {
    document.getElementById('profile-name').innerText = 'Please log in';
    return;
  }
  document.getElementById('profile-name').innerText = `Name: ${currentProfileUser.full_name}`;
  document.getElementById('profile-email').innerText = `Email: ${currentProfileUser.email}`;
  document.getElementById('profile-username').innerText = `Username: ${currentProfileUser.username}`;
  document.getElementById('profile-phone').innerText = `Phone: ${currentProfileUser.phone_number || 'N/A'}`;
  document.getElementById('profile-joined').innerText = currentProfileUser.joined_at
    ? new Date(currentProfileUser.joined_at).toLocaleDateString()
    : 'N/A';

  document.getElementById('edit-full-name').value = currentProfileUser.full_name;
  document.getElementById('edit-username').value = currentProfileUser.username;
  document.getElementById('edit-phone').value = currentProfileUser.phone_number || '';

  document.getElementById('edit-code').value = codeVisible
    ? (currentProfileUser.login_code || '')
    : '********';
}

document.getElementById('toggle-code').addEventListener('click', () => {
  codeVisible = !codeVisible;
  if (!currentProfileUser) return;
  document.getElementById('edit-code').value = codeVisible
    ? (currentProfileUser.login_code || '')
    : '********';
});

document.getElementById('reset-code').addEventListener('click', async () => {
  if (!currentProfileUser) return;
  const newCode = 'CODE-' + Math.floor(Math.random() * 1000000);
  const { data, error } = await supabaseProfile
    .from('users')
    .update({ login_code: newCode })
    .match({ id: currentProfileUser.id })
    .single();
  if (!error && data) {
    currentProfileUser = data;
    if (codeVisible) {
      document.getElementById('edit-code').value = currentProfileUser.login_code;
    } else {
      document.getElementById('edit-code').value = '********';
    }
    alert('Login code reset!');
  }
});

document.getElementById('save-profile').addEventListener('click', async () => {
  if (!currentProfileUser) return;
  const newFullName = document.getElementById('edit-full-name').value;
  const newUsername = document.getElementById('edit-username').value;
  const newPhone = document.getElementById('edit-phone').value;

  const { data, error } = await supabaseProfile
    .from('users')
    .update({
      full_name: newFullName,
      username: newUsername,
      phone_number: newPhone
    })
    .match({ id: currentProfileUser.id })
    .single();

  if (error) {
    alert('Error updating profile: ' + error.message);
  } else {
    currentProfileUser = data;
    alert('Profile updated!');
    renderProfile();
  }
});

(async function init() {
  currentProfileUser = await fetchProfileUser();
  renderProfile();
})();

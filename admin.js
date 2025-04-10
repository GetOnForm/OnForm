const supabaseAdmin = supabase.createClient(
  'https://YOUR_SUPABASE_PROJECT_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

document.getElementById('view-users').addEventListener('click', async () => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*');
  const content = document.getElementById('admin-content');
  if (error) {
    content.innerHTML = '<p>Error loading users.</p>';
  } else {
    let html = '<h2>All Users</h2><ul>';
    data.forEach(u => {
      html += `<li>${u.full_name} - ${u.email} - ${u.username} - Deactivated: ${u.is_deactivated}</li>`;
    });
    html += '</ul>';
    content.innerHTML = html;
  }
});

document.getElementById('view-groups').addEventListener('click', async () => {
  const { data, error } = await supabaseAdmin
    .from('groups')
    .select('*');
  const content = document.getElementById('admin-content');
  if (error) {
    content.innerHTML = '<p>Error loading groups.</p>';
  } else {
    let html = '<h2>All Groups</h2><ul>';
    data.forEach(g => {
      html += `<li>${g.name} - Certified: ${g.is_certified} - Public: ${g.is_public}</li>`;
    });
    html += '</ul>';
    content.innerHTML = html;
  }
});

document.getElementById('view-impersonate').addEventListener('click', () => {
  const userName = prompt('Enter username to impersonate:');
  if (userName) {
    // Example: store in sessionStorage, then redirect
    sessionStorage.setItem('impersonateUsername', userName);
    alert(`Impersonating ${userName}. Now go to dashboard.`);
  }
});

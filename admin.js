const supabaseAdmin = supabase.createClient(
 'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
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

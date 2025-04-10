const supabaseGroups = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentGroupUser = null;

async function fetchGroupUser() {
  const { data: sessionData } = await supabaseGroups.auth.getSession();
  if (sessionData?.session?.user) {
    const userEmail = sessionData.session.user.email;
    const { data: userRec } = await supabaseGroups
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();
    if (userRec) return userRec;
  }
  // Check impersonation
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data, error } = await supabaseGroups
      .from('users')
      .select('*')
      .eq('username', impersonate)
      .single();
    if (data) return data;
  }
  return null;
}

async function loadGroups() {
  if (!currentGroupUser) {
    document.getElementById('groups-container').innerHTML = '<p>Please log in.</p>';
    return;
  }

  const { data: memberRows, error } = await supabaseGroups
    .from('group_members')
    .select('group_id, groups(name, description)')
    .eq('user_id', currentGroupUser.id);

  const container = document.getElementById('groups-container');
  container.innerHTML = '';
  if (!memberRows || memberRows.length === 0) {
    container.innerHTML = '<p>No groups found. Create one!</p>';
  } else {
    memberRows.forEach(row => {
      const card = document.createElement('div');
      card.className = 'group-card';
      card.innerHTML = `
        <h3>${row.groups.name}</h3>
        <p>${row.groups.description}</p>
      `;
      container.appendChild(card);
    });
  }
}

document.getElementById('group-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentGroupUser) {
    alert('Please log in first.');
    return;
  }
  const name = document.getElementById('group-name').value;
  const description = document.getElementById('group-description').value;
  const visibility = document.getElementById('group-visibility').value;
  const joinReq = document.getElementById('group-join-requirement').value;
  const coinEntry = parseInt(document.getElementById('group-coin-entry').value) || 0;

  const isPublic = (visibility === 'public');
  const isPrivate = !isPublic;
  const requestRequired = (joinReq === 'request');

  const { data, error } = await supabaseGroups
    .from('groups')
    .insert([{
      name,
      description,
      is_public: isPublic,
      is_private: isPrivate,
      request_required: requestRequired,
      coin_entry_requirement: coinEntry,
      created_by: currentGroupUser.id
    }])
    .single();

  if (error) {
    alert('Error creating group: ' + error.message);
  } else {
    alert('Group created successfully!');
    await supabaseGroups.from('group_members').insert([{
      group_id: data.id,
      user_id: currentGroupUser.id,
      role: 'super_admin'
    }]);
    loadGroups();
  }
});

(async function init() {
  currentGroupUser = await fetchGroupUser();
  await loadGroups();
})();

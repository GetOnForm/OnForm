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
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data } = await supabaseGroups
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
  const { data: memberRows } = await supabaseGroups
    .from('group_members')
    .select('group_id, role, groups(name, description, id)')
    .eq('user_id', currentGroupUser.id)
    .in('membership_status', ['active','pending']); // show pending or active

  const container = document.getElementById('groups-container');
  container.innerHTML = '';
  if (!memberRows || memberRows.length === 0) {
    container.innerHTML = '<p>No groups found. Create one!</p>';
  } else {
    memberRows.forEach(row => {
      const g = row.groups;
      container.innerHTML += `
        <div class="group-card">
          <h3>${g.name}</h3>
          <p>${g.description}</p>
          <p>Role: ${row.role}</p>
          <button onclick="goToGroupDetail('${g.id}')">View Detail</button>
        </div>
      `;
    });
  }
}

function goToGroupDetail(groupId) {
  window.location.href = `group_detail.html?id=${groupId}`;
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
      role: 'super_admin',
      membership_status: 'active'
    }]);
    loadGroups();
  }
});

// Searching public groups
document.getElementById('search-btn').addEventListener('click', async () => {
  const query = document.getElementById('search-query').value.trim();
  const { data: results } = await supabaseGroups
    .from('groups')
    .select('*')
    .eq('is_public', true)
    .ilike('name', `%${query}%`);

  const sr = document.getElementById('search-results');
  sr.innerHTML = '';
  if (!results || results.length === 0) {
    sr.innerHTML = '<p>No public groups found.</p>';
  } else {
    results.forEach(g => {
      sr.innerHTML += `
        <div class="group-card">
          <h4>${g.name}</h4>
          <p>${g.description}</p>
          <button onclick="joinPublicGroup('${g.id}', ${g.request_required}, '${g.name}')">
            ${g.request_required ? 'Request to Join' : 'Join'}
          </button>
        </div>
      `;
    });
  }
});

async function joinPublicGroup(groupId, requestRequired, groupName) {
  if (!currentGroupUser) return alert('Please log in first');
  // check if already a member
  const { data: memCheck } = await supabaseGroups
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', currentGroupUser.id)
    .single();
  if (memCheck) {
    alert('You are already in or pending in this group');
    return;
  }

  const statusVal = requestRequired ? 'pending' : 'active';
  const { error } = await supabaseGroups
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: currentGroupUser.id,
      role: 'member',
      membership_status: statusVal
    });
  if (error) {
    alert('Error joining group: ' + error.message);
  } else {
    alert(requestRequired
      ? `Request sent to join ${groupName}`
      : `Joined ${groupName} successfully`);
    loadGroups();
  }
}

// Join by code
document.getElementById('code-join-btn').addEventListener('click', async () => {
  const codeVal = document.getElementById('code-join-input').value.trim();
  if (!codeVal) return;
  // find group by code
  const { data: grp } = await supabaseGroups
    .from('groups')
    .select('*')
    .eq('join_code', codeVal)
    .single();
  if (!grp) return alert('No group found by that code');

  // check membership
  const { data: memCheck } = await supabaseGroups
    .from('group_members')
    .select('*')
    .eq('group_id', grp.id)
    .eq('user_id', currentGroupUser.id)
    .single();
  if (memCheck) {
    alert('Already a member or pending');
    return;
  }

  // request or auto-join
  const statusVal = grp.request_required ? 'pending' : 'active';
  const { error } = await supabaseGroups
    .from('group_members')
    .insert({
      group_id: grp.id,
      user_id: currentGroupUser.id,
      role: 'member',
      membership_status: statusVal
    });
  if (error) {
    alert('Error using code: ' + error.message);
  } else {
    alert(statusVal === 'pending'
      ? 'Request sent to join group.'
      : 'Joined group successfully');
    loadGroups();
  }
});

(async function init() {
  currentGroupUser = await fetchGroupUser();
  await loadGroups();
})();

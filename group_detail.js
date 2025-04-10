const supabaseGroupDetail = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentUser = null;
let currentGroup = null;
let userRole = 'member';

async function fetchCurrentUser() {
  const { data: sessionData } = await supabaseGroupDetail.auth.getSession();
  if (sessionData?.session?.user) {
    const userEmail = sessionData.session.user.email;
    if (userEmail) {
      const { data: userRec } = await supabaseGroupDetail
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
      if (userRec) return userRec;
    }
  }
  const imp = sessionStorage.getItem('impersonateUsername');
  if (imp) {
    const { data } = await supabaseGroupDetail
      .from('users')
      .select('*')
      .eq('username', imp)
      .single();
    return data;
  }
  return null;
}

async function loadGroupDetail() {
  // get group id from query param, e.g. group_detail.html?id=xxxxx
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');
  if (!groupId) {
    document.querySelector('.groups').innerHTML = '<p>No group specified</p>';
    return;
  }

  // fetch group
  const { data: grp, error } = await supabaseGroupDetail
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
  if (!grp) {
    document.querySelector('.groups').innerHTML = '<p>Group not found</p>';
    return;
  }
  currentGroup = grp;

  document.getElementById('group-title').innerText = grp.name;
  document.getElementById('group-description').innerText = grp.description;
  document.getElementById('group-code').innerText = grp.join_code || 'N/A';

  // check membership
  const { data: mem } = await supabaseGroupDetail
    .from('group_members')
    .select('role, membership_status')
    .eq('group_id', groupId)
    .eq('user_id', currentUser.id)
    .single();

  if (mem) {
    userRole = mem.role;
  }

  // if userRole is super_admin or admin, show refresh-code-btn, membership requests, challenge creation
  if (userRole === 'super_admin' || userRole === 'admin') {
    document.getElementById('refresh-code-btn').style.display = 'inline-block';
    document.getElementById('membership-requests').style.display = 'block';
    document.getElementById('challenge-section').style.display = 'block';
  }

  loadMembers();
  loadRequests();
  loadChallenges();
}

async function loadMembers() {
  if (!currentGroup) return;
  const { data: members } = await supabaseGroupDetail
    .from('group_members')
    .select('membership_status, role, users(username, full_name)')
    .eq('group_id', currentGroup.id);

  const container = document.getElementById('members-list');
  container.innerHTML = '';
  if (!members || members.length === 0) {
    container.innerHTML = '<li>No members</li>';
    return;
  }
  members.forEach(m => {
    container.innerHTML += `<li>
      ${m.users.full_name} (@${m.users.username}) - [${m.role}] - (${m.membership_status})
      ${ (userRole === 'super_admin' || userRole === 'admin') && m.role !== 'super_admin'
        ? `<button onclick="removeMember('${m.users.username}')">Remove</button>`
        : '' }
    </li>`;
  });
}

async function removeMember(username) {
  if (!confirm(`Remove ${username} from group?`)) return;
  const { data: userRec } = await supabaseGroupDetail
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (!userRec) return alert('User not found');

  await supabaseGroupDetail
    .from('group_members')
    .delete()
    .match({ group_id: currentGroup.id, user_id: userRec.id });
  alert(`Removed ${username}`);
  loadMembers();
}

async function loadRequests() {
  const requestsList = document.getElementById('requests-list');
  requestsList.innerHTML = '';
  if (userRole !== 'super_admin' && userRole !== 'admin') return;

  const { data: pending } = await supabaseGroupDetail
    .from('group_members')
    .select('user_id, membership_status, users(username, full_name)')
    .eq('group_id', currentGroup.id)
    .eq('membership_status', 'pending');
  if (!pending || pending.length === 0) {
    requestsList.innerHTML = '<li>No pending requests</li>';
    return;
  }
  pending.forEach(p => {
    requestsList.innerHTML += `<li>
      ${p.users.full_name} (@${p.users.username})
      <button onclick="approveRequest('${p.users.username}')">Approve</button>
    </li>`;
  });
}

async function approveRequest(username) {
  const { data: userRec } = await supabaseGroupDetail
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (!userRec) return alert('User not found');

  await supabaseGroupDetail
    .from('group_members')
    .update({ membership_status: 'active' })
    .match({ group_id: currentGroup.id, user_id: userRec.id });
  alert('User approved');
  loadRequests();
  loadMembers();
}

document.getElementById('refresh-code-btn').addEventListener('click', async () => {
  const newCode = 'GROUP-' + Math.floor(Math.random() * 1000000);
  const { error } = await supabaseGroupDetail
    .from('groups')
    .update({ join_code: newCode })
    .eq('id', currentGroup.id);
  if (error) {
    alert('Error generating code: ' + error.message);
  } else {
    alert('New join code generated');
    document.getElementById('group-code').innerText = newCode;
  }
});

// Challenge creation
async function loadChallenges() {
  const { data: challs } = await supabaseGroupDetail
    .from('challenges')
    .select('*')
    .eq('group_id', currentGroup.id);
  const clist = document.getElementById('challenge-list');
  clist.innerHTML = '';
  if (!challs || challs.length === 0) {
    clist.innerHTML = '<li>No challenges</li>';
    return;
  }
  challs.forEach(c => {
    clist.innerHTML += `<li>${c.name} - Fee: ${c.entry_fee}, ${c.start_date} to ${c.end_date}</li>`;
  });
}

document.getElementById('create-challenge-btn').addEventListener('click', async () => {
  const name = document.getElementById('challenge-name').value.trim();
  const desc = document.getElementById('challenge-desc').value.trim();
  const fee = parseInt(document.getElementById('challenge-fee').value, 10) || 0;
  const start = document.getElementById('challenge-start').value;
  const end = document.getElementById('challenge-end').value;
  if (!name || !start || !end) return alert('Missing fields');

  // Insert
  const { error } = await supabaseGroupDetail
    .from('challenges')
    .insert({
      group_id: currentGroup.id,
      name,
      description: desc,
      entry_fee: fee,
      start_date: start,
      end_date: end,
      created_by: currentUser.id
    });
  if (error) {
    alert('Error creating challenge: ' + error.message);
  } else {
    alert('Challenge created!');
    loadChallenges();
  }
});

(async function init() {
  currentUser = await fetchCurrentUser();
  await loadGroupDetail();
})();

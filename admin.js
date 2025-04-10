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
      html += `<li>
        ${u.full_name} | ${u.email} | ${u.username} | 
        Role: ${u.role} | Deactivated: ${u.is_deactivated} | 
        Streak: ${u.current_streak}/${u.longest_streak}
      </li>`;
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
      html += `<li>
        ${g.name} | Certified: ${g.is_certified} | Public: ${g.is_public} | Join Code: ${g.join_code || 'N/A'}
      </li>`;
    });
    html += '</ul>';
    content.innerHTML = html;
  }
});

document.getElementById('view-impersonate').addEventListener('click', () => {
  const userName = prompt('Enter username to impersonate:');
  if (userName) {
    sessionStorage.setItem('impersonateUsername', userName);
    alert(`Impersonating ${userName}. Go to dashboard.`);
  }
});

// Adjust user coins
document.getElementById('admin-coin-button').addEventListener('click', async () => {
  const username = document.getElementById('admin-username-coin').value.trim();
  const amount = parseInt(document.getElementById('admin-coin-amount').value, 10);
  if (!username || isNaN(amount)) return alert('Invalid input');

  // Find user
  const { data: userRec, error: userErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (!userRec) return alert('User not found');

  const newBalance = userRec.total_coins + amount;
  // update
  const { error: updateErr } = await supabaseAdmin
    .from('users')
    .update({ total_coins: newBalance })
    .eq('id', userRec.id);

  if (updateErr) {
    alert('Error adjusting coins: ' + updateErr.message);
  } else {
    // optional coin transaction log
    await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: userRec.id,
        amount: amount,
        transaction_type: 'admin_adjust'
      });
    alert(`Coins adjusted. New balance: ${newBalance}`);
  }
});

// Toggle group certification
document.getElementById('admin-certify-button').addEventListener('click', async () => {
  const gName = document.getElementById('admin-group-name').value.trim();
  if (!gName) return alert('No group name provided');

  const { data: grp, error: gErr } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('name', gName)
    .single();
  if (!grp) return alert('Group not found');

  const newVal = !grp.is_certified;
  const { error: updErr } = await supabaseAdmin
    .from('groups')
    .update({ is_certified: newVal })
    .eq('id', grp.id);
  if (updErr) return alert('Error toggling certification: ' + updErr.message);
  alert(`Group "${gName}" certified set to ${newVal}.`);
});

// Force add member to group
document.getElementById('admin-add-member-button').addEventListener('click', async () => {
  const username = document.getElementById('admin-add-username').value.trim();
  const groupName = document.getElementById('admin-add-group').value.trim();
  if (!username || !groupName) return alert('Invalid input');

  // find user
  const { data: userRec } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (!userRec) return alert('User not found');

  // find group
  const { data: grp } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('name', groupName)
    .single();
  if (!grp) return alert('Group not found');

  // check if already member
  const { data: memCheck } = await supabaseAdmin
    .from('group_members')
    .select('*')
    .eq('group_id', grp.id)
    .eq('user_id', userRec.id)
    .single();
  if (memCheck) {
    alert('User is already in this group or pending');
    return;
  }

  // insert
  const { error: insErr } = await supabaseAdmin
    .from('group_members')
    .insert({
      group_id: grp.id,
      user_id: userRec.id,
      role: 'member',
      membership_status: 'active'
    });
  if (insErr) {
    alert('Error forcibly adding member: ' + insErr.message);
  } else {
    alert(`Successfully added ${username} to ${groupName}`);
  }
});

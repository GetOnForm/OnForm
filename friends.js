const supabaseFriends = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentFriendUser = null;

async function fetchUserForFriends() {
  const { data: sessionData } = await supabaseFriends.auth.getSession();
  if (sessionData?.session?.user) {
    const userEmail = sessionData.session.user.email;
    if (userEmail) {
      const { data: userRec } = await supabaseFriends
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
      if (userRec) return userRec;
    }
  }
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data } = await supabaseFriends
      .from('users')
      .select('*')
      .eq('username', impersonate)
      .single();
    if (data) return data;
  }
  return null;
}

async function loadFriends() {
  if (!currentFriendUser) return;
  const { data, error } = await supabaseFriends
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${currentFriendUser.id},friend_id.eq.${currentFriendUser.id}`);

  const list = document.getElementById('friends-list');
  const pendingList = document.getElementById('pending-requests');
  list.innerHTML = '';
  pendingList.innerHTML = '';

  if (!data) return;

  for (let f of data) {
    const isRequester = (f.user_id === currentFriendUser.id);
    const friendId = isRequester ? f.friend_id : f.user_id;

    const { data: friendProfile } = await supabaseFriends
      .from('users')
      .select('username, full_name, show_streak_to_friends, show_email_to_friends, show_phone_to_friends, email, phone_number, current_streak')
      .eq('id', friendId)
      .single();

    if (!friendProfile) continue;

    if (f.status === 'accepted') {
      // Build friend list item
      let itemHtml = `<strong>${friendProfile.full_name}</strong> (@${friendProfile.username}) `;
      itemHtml += `<button onclick="toggleFriendInfo('${friendId}')">Show Info</button>`;
      itemHtml += `<div id="friend-info-${friendId}" style="display:none;">`;

      // If friend allows
      if (friendProfile.show_streak_to_friends) {
        itemHtml += `<p>Streak: ${friendProfile.current_streak}</p>`;
      }
      if (friendProfile.show_email_to_friends) {
        itemHtml += `<p>Email: ${friendProfile.email}</p>`;
      }
      if (friendProfile.show_phone_to_friends) {
        itemHtml += `<p>Phone: ${friendProfile.phone_number || 'N/A'}</p>`;
      }
      itemHtml += `</div>`;

      list.innerHTML += `<li>${itemHtml}</li>`;
    } else if (!isRequester && f.status === 'pending') {
      pendingList.innerHTML += `<li>
        ${friendProfile.full_name} (@${friendProfile.username}) wants to be friends 
        <button onclick="acceptFriend('${f.user_id}', '${f.friend_id}')">Accept</button>
      </li>`;
    }
  }
}

function toggleFriendInfo(friendId) {
  const infoDiv = document.getElementById(`friend-info-${friendId}`);
  if (!infoDiv) return;
  infoDiv.style.display = (infoDiv.style.display === 'none') ? 'block' : 'none';
}

async function acceptFriend(uId, fId) {
  await supabaseFriends
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .match({ user_id: uId, friend_id: fId });
  await supabaseFriends
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .match({ user_id: fId, friend_id: uId });
  loadFriends();
}

document.getElementById('request-friend').addEventListener('click', async () => {
  if (!currentFriendUser) return;
  const code = document.getElementById('friend-code').value;
  if (!code) return;

  let { data: targetUser } = await supabaseFriends
    .from('users')
    .select('*')
    .eq('friend_code', code)
    .single();
  if (!targetUser) return alert('User not found by that code');

  if (targetUser.id === currentFriendUser.id) return alert('Cannot friend yourself');

  let existing = await supabaseFriends
    .from('friendships')
    .select('*')
    .or(`(user_id.eq.${currentFriendUser.id},friend_id.eq.${targetUser.id}),(user_id.eq.${targetUser.id},friend_id.eq.${currentFriendUser.id})`);
  if (existing.data && existing.data.length > 0) {
    return alert('Already friends or pending request');
  }

  // Insert both ways
  await supabaseFriends
    .from('friendships')
    .insert([
      { user_id: currentFriendUser.id, friend_id: targetUser.id, status: 'pending' },
      { user_id: targetUser.id, friend_id: currentFriendUser.id, status: 'pending' }
    ]);
  alert('Friend request sent');
  loadFriends();
});

(async function init() {
  currentFriendUser = await fetchUserForFriends();
  await loadFriends();
})();

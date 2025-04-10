const supabaseDash = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentUser = null;

async function fetchCurrentUser() {
  const { data: sessionData } = await supabaseDash.auth.getSession();
  if (sessionData?.session?.user) {
    const emailVal = sessionData.session.user.email;
    const { data: userRec } = await supabaseDash
      .from('users')
      .select('*')
      .eq('email', emailVal)
      .single();
    if (userRec) return userRec;
  }
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data } = await supabaseDash
      .from('users')
      .select('*')
      .eq('username', impersonate)
      .single();
    if (data) return data;
  }
  return null;
}

async function loadDashboard() {
  currentUser = await fetchCurrentUser();
  if (!currentUser) {
    document.getElementById('welcome-name').innerText = 'Please Log In';
    return;
  }
  document.getElementById('welcome-name').innerText = `Welcome, ${currentUser.full_name}`;
  document.getElementById('coin-balance').innerText = currentUser.total_coins;
  document.getElementById('streak-count').innerText = currentUser.current_streak;

  await runMaintenance(currentUser);

  const { data: updated } = await supabaseDash
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  if (updated) {
    currentUser = updated;
    document.getElementById('coin-balance').innerText = currentUser.total_coins;
    document.getElementById('streak-count').innerText = currentUser.current_streak;
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: tasks } = await supabaseDash
    .from('task_templates')
    .select('*')
    .eq('user_id', currentUser.id);

  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<li>No tasks for today</li>';
    return;
  }

  const dailyOrOnce = tasks.filter(t => {
    if (t.frequency === 'daily') return (today >= t.start_date && today <= t.end_date);
    if (t.frequency === 'once') return (t.start_date === today && t.end_date === today);
    return false;
  });

  if (dailyOrOnce.length === 0) {
    taskList.innerHTML = '<li>No tasks for today</li>';
  } else {
    dailyOrOnce.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fas fa-check-square"></i> ${t.title} (${t.frequency})`;
      taskList.appendChild(li);
    });
  }
}

loadDashboard();

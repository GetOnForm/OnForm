const supabaseDash = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentUser = null;

async function fetchCurrentUser() {
  const { data: sessionData, error } = await supabaseDash.auth.getSession();
  if (sessionData?.session?.user) {
    const userEmail = sessionData.session.user.email;
    if (userEmail) {
      const { data: userRec, error: userErr } = await supabaseDash
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
      if (userRec) return userRec;
    }
  }

  // If not logged in, see if there's impersonation
  const impersonate = sessionStorage.getItem('impersonateUsername');
  if (impersonate) {
    const { data, error } = await supabaseDash
      .from('users')
      .select('*')
      .eq('username', impersonate)
      .single();
    if (data) return data;
  }

  // Otherwise no user found
  return null;
}

async function loadDashboard() {
  currentUser = await fetchCurrentUser();
  if (!currentUser) {
    // Optionally redirect to signup or show message
    document.getElementById('welcome-name').innerText = 'Please log in';
    return;
  }

  document.getElementById('welcome-name').innerText = `Welcome, ${currentUser.full_name}`;
  document.getElementById('coin-balance').innerText = currentUser.total_coins;
  document.getElementById('streak-count').innerText = currentUser.current_streak;

  // Run daily/weekly checks & finalize challenges
  await runMaintenance(currentUser);

  // Refresh user data
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

  // Example: fetch today's tasks
  const today = new Date().toISOString().split('T')[0];
  const { data: tasks, error: tasksError } = await supabaseDash
    .from('task_templates')
    .select('*')
    .eq('user_id', currentUser.id);
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  if (!tasksError && tasks && tasks.length > 0) {
    const dailyOrOnce = tasks.filter(t => {
      if (t.frequency === 'daily') {
        return (today >= t.start_date && today <= t.end_date);
      } else if (t.frequency === 'once') {
        return (today === t.start_date && t.start_date === t.end_date);
      }
      return false;
    });
    if (dailyOrOnce.length === 0) {
      taskList.innerHTML = '<li>No tasks for today</li>';
    } else {
      dailyOrOnce.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `${t.title} (${t.frequency})`;
        taskList.appendChild(li);
      });
    }
  } else {
    taskList.innerHTML = '<li>No tasks for today</li>';
  }
}

loadDashboard();

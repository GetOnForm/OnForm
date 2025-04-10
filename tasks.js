const supabaseTasks = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentTaskUser = null;

async function fetchTaskUser() {
  const { data: sessionData } = await supabaseTasks.auth.getSession();
  if (sessionData?.session?.user) {
    const email = sessionData.session.user.email;
    if (email) {
      const { data: userRec } = await supabaseTasks
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (userRec) return userRec;
    }
  }
  const imp = sessionStorage.getItem('impersonateUsername');
  if (imp) {
    const { data } = await supabaseTasks
      .from('users')
      .select('*')
      .eq('username', imp)
      .single();
    if (data) return data;
  }
  return null;
}

// Create a new task template
document.getElementById('create-task-btn').addEventListener('click', async () => {
  if (!currentTaskUser) return alert('Please log in');
  const title = document.getElementById('task-title').value.trim();
  const freq = document.getElementById('task-frequency').value;
  const mustDo = document.getElementById('task-mustdo').checked;
  const startDate = document.getElementById('task-start').value;
  const endDate = document.getElementById('task-end').value;
  const hoursReq = parseFloat(document.getElementById('task-hours').value) || 0;
  const timesWeek = parseInt(document.getElementById('task-times').value, 10) || 0;

  if (!title || !startDate) return alert('Title and Start Date required');
  if (freq === 'once' && !endDate) {
    // for once, enddate == startdate
    alert('For once tasks, set the End Date same as Start date');
    return;
  }

  const { error } = await supabaseTasks
    .from('task_templates')
    .insert({
      user_id: currentTaskUser.id,
      title,
      frequency: freq,
      is_must_do: mustDo,
      start_date: startDate,
      end_date: endDate || startDate,
      hours_required: hoursReq,
      times_per_week: timesWeek
    });
  if (error) {
    alert('Error creating task: ' + error.message);
  } else {
    alert('Task created!');
    loadTodayTasks();
    loadWeekTasks();
  }
});

async function loadTodayTasks() {
  if (!currentTaskUser) return;
  const today = new Date().toISOString().split('T')[0];

  // fetch daily tasks or once tasks that match today
  const { data: tpls } = await supabaseTasks
    .from('task_templates')
    .select('*')
    .eq('user_id', currentTaskUser.id);

  const container = document.getElementById('today-tasks');
  container.innerHTML = '';

  if (!tpls || tpls.length === 0) {
    container.innerHTML = '<p>No tasks found</p>';
    return;
  }

  // Filter daily or once tasks for "today"
  const relevant = tpls.filter(t => {
    if (t.frequency === 'daily' && today >= t.start_date && today <= t.end_date) return true;
    if (t.frequency === 'once' && t.start_date === today && t.end_date === today) return true;
    return false;
  });

  if (relevant.length === 0) {
    container.innerHTML = '<p>No tasks for today</p>';
    return;
  }

  for (let rt of relevant) {
    // see if we have an instance for today
    const { data: inst } = await supabaseTasks
      .from('task_instances')
      .select('*')
      .eq('template_id', rt.id)
      .eq('instance_date', today)
      .single();

    const isComplete = inst && inst.is_completed;
    const li = document.createElement('div');
    li.className = `task-instance ${isComplete ? 'completed' : ''}`;
    li.innerHTML = `
      <span>${rt.title} (${rt.frequency}) ${rt.is_must_do ? '[MUST DO]' : ''}</span>
      <button onclick="toggleComplete('${rt.id}', '${today}', ${isComplete})">
        ${isComplete ? 'Undo' : 'Complete'}
      </button>
    `;
    container.appendChild(li);
  }
}

async function toggleComplete(templateId, dateStr, currentlyComplete) {
  // if instance exists, update. if not, create one
  if (!currentTaskUser) return;
  if (currentlyComplete) {
    // set is_completed = false
    await supabaseTasks
      .from('task_instances')
      .update({ is_completed: false, completed_at: null })
      .eq('template_id', templateId)
      .eq('instance_date', dateStr);
  } else {
    // either insert or update
    const { data: checkInst } = await supabaseTasks
      .from('task_instances')
      .select('*')
      .eq('template_id', templateId)
      .eq('instance_date', dateStr)
      .single();
    if (checkInst) {
      await supabaseTasks
        .from('task_instances')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', checkInst.id);
    } else {
      await supabaseTasks
        .from('task_instances')
        .insert({
          template_id: templateId,
          instance_date: dateStr,
          is_completed: true,
          completed_at: new Date().toISOString()
        });
    }
  }
  loadTodayTasks();
  // optional: re-run maintenance or partial check
}

// Weekly tasks
async function loadWeekTasks() {
  if (!currentTaskUser) return;
  // for demonstration, let's list all weekly tasks. we won't do partial sub-day checks
  const { data: tpls } = await supabaseTasks
    .from('task_templates')
    .select('*')
    .eq('user_id', currentTaskUser.id)
    .eq('frequency', 'weekly');

  const container = document.getElementById('week-tasks');
  container.innerHTML = '';
  if (!tpls || tpls.length === 0) {
    container.innerHTML = '<p>No weekly tasks</p>';
    return;
  }

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Sunday
  // or Monday if you prefer. Just for example
  const sundayStr = thisWeekStart.toISOString().split('T')[0];

  tpls.forEach(t => {
    const row = document.createElement('div');
    row.className = 'task-instance';
    row.innerHTML = `
      <span>${t.title} (Need ${t.times_per_week} times/week) 
        ${t.is_must_do ? '[MUST DO]' : ''}
      </span>
      <button onclick="markWeeklyComplete('${t.id}')">Mark Progress (Demo)</button>
    `;
    container.appendChild(row);
  });
}

function markWeeklyComplete(templateId) {
  alert('In a real system, you’d increment partial completion, track if it hits times_per_week, etc.');
  // For demonstration only
}

// init
(async function() {
  currentTaskUser = await fetchTaskUser();
  loadTodayTasks();
  loadWeekTasks();
})();

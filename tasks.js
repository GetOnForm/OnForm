const supabaseTasks = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

let currentTaskUser = null;

async function fetchTaskUser() {
  const { data: sessionData } = await supabaseTasks.auth.getSession();
  if (sessionData?.session?.user) {
    const email = sessionData.session.user.email;
    const { data: userRec } = await supabaseTasks
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (userRec) return userRec;
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

document.getElementById('create-task-btn').addEventListener('click', async () => {
  if (!currentTaskUser) return alert('Please log in');
  const title = document.getElementById('task-title').value.trim();
  const freq = document.getElementById('task-frequency').value;
  const mustDo = document.getElementById('task-mustdo').checked;
  const startDate = document.getElementById('task-start').value;
  const endDate = document.getElementById('task-end').value;
  const hoursReq = parseFloat(document.getElementById('task-hours').value) || 0;
  const timesWeek = parseInt(document.getElementById('task-times').value) || 0;

  if (!title || !startDate) return alert('Title and Start Date required');
  if (freq === 'once' && !endDate) {
    alert('For once tasks, set End Date same as Start date');
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
  const relevant = tpls.filter(t => {
    if (t.frequency === 'daily') return (today >= t.start_date && today <= t.end_date);
    if (t.frequency === 'once') return (t.start_date === today && t.end_date === today);
    return false;
  });
  if (relevant.length === 0) {
    container.innerHTML = '<p>No tasks for today</p>';
    return;
  }

  for (let rt of relevant) {
    const { data: inst } = await supabaseTasks
      .from('task_instances')
      .select('*')
      .eq('template_id', rt.id)
      .eq('instance_date', today)
      .single();
    const isComplete = inst && inst.is_completed;

    const row = document.createElement('div');
    row.className = `task-instance ${isComplete ? 'completed' : ''}`;
    row.innerHTML = `
      <span>
        <i class="fas fa-check-square"></i>
        ${rt.title} (${rt.frequency})
        ${rt.is_must_do ? '<strong>[MUST]</strong>' : ''}
      </span>
      <button onclick="toggleComplete('${rt.id}', '${today}', ${isComplete})">
        ${isComplete ? 'Undo' : 'Complete'}
      </button>
    `;
    container.appendChild(row);
  }
}

async function toggleComplete(templateId, dateStr, currentlyComplete) {
  if (!currentTaskUser) return;
  if (currentlyComplete) {
    await supabaseTasks
      .from('task_instances')
      .update({ is_completed: false, completed_at: null })
      .eq('template_id', templateId)
      .eq('instance_date', dateStr);
  } else {
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
}

async function loadWeekTasks() {
  if (!currentTaskUser) return;
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
  tpls.forEach(t => {
    const row = document.createElement('div');
    row.className = 'task-instance';
    row.innerHTML = `
      <span><i class="fas fa-check-square"></i> ${t.title} (Need ${t.times_per_week}/week) 
        ${t.is_must_do ? '<strong>[MUST]</strong>' : ''}
      </span>
      <button onclick="markWeeklyComplete('${t.id}')">Mark Progress</button>
    `;
    container.appendChild(row);
  });
}

function markWeeklyComplete(templateId) {
  alert('Demo: Track partial weekly progress. Real logic not fully implemented.');
}

(async function() {
  currentTaskUser = await fetchTaskUser();
  await loadTodayTasks();
  await loadWeekTasks();
})();

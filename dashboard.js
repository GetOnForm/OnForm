const supabaseClient = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);
const dummyUserId = '00000000-0000-0000-0000-000000000001';

async function loadDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const { data: tasks, error: tasksError } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('user_id', dummyUserId)
    .eq('date', today);
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  if (tasksError || !tasks || tasks.length === 0) {
    taskList.innerHTML = '<li>No tasks for today</li>';
  } else {
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task ${task.completed ? 'complete' : 'pending'}`;
      li.innerHTML = `${task.title} <span class="status">${task.completed ? '✔' : '○'}</span>`;
      taskList.appendChild(li);
    });
  }
  const { data: streakRow } = await supabaseClient
    .from('streaks')
    .select('current_streak')
    .eq('user_id', dummyUserId)
    .single();
  document.getElementById('welcome-name').innerText = 'Welcome, Anele';
  document.getElementById('streak-count').innerText = (streakRow?.current_streak || 0) + ' days';
  const totalTasks = 7;
  const completedTasks = tasks ? tasks.filter(t => t.completed).length : 0;
  const progressPercentage = (completedTasks / totalTasks) * 100;
  document.getElementById('streak-progress').style.width = progressPercentage + '%';
  document.getElementById('progress-text').innerText = `Progress: ${completedTasks} out of ${totalTasks} tasks complete`;
  const { data: rewards, error: rewardsError } = await supabaseClient
    .from('rewards')
    .select('*')
    .order('required_streak');
  const rewardGrid = document.getElementById('reward-grid');
  rewardGrid.innerHTML = '';
  if (!rewardsError && rewards) {
    rewards.forEach(reward => {
      const card = document.createElement('div');
      card.className = 'reward-card';
      if (streakRow.current_streak < reward.required_streak) card.classList.add('locked');
      card.innerHTML = `<h3>${reward.name}</h3><p>${reward.description}</p>`;
      rewardGrid.appendChild(card);
    });
  }
  const { data: passData, error: passError } = await supabaseClient
    .from('performance_passes')
    .select('*')
    .eq('user_id', dummyUserId)
    .single();
  const ppInfo = document.getElementById('performance-pass-info');
  if (!passError && passData && passData.activated) {
    ppInfo.innerHTML = `<p>Your Performance Pass is active. Deposit: R${passData.deposit}. Expires: ${new Date(passData.expires_at).toLocaleDateString()}</p>`;
  } else {
    ppInfo.innerHTML = `<p>You have not activated a Performance Pass. <a href="profile.html">Learn more</a></p>`;
  }
}

loadDashboard();

// dashboard.js

cconst { createClient } = supabase;
const supabaseClient = createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);


const dummyUserId = '00000000-0000-0000-0000-000000000001';

async function loadDashboard() {
  const today = new Date().toISOString().split("T")[0];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', dummyUserId)
    .eq('date', today);

  const taskList = document.querySelector(".tasks ul");
  taskList.innerHTML = '';

  if (error) {
    taskList.innerHTML = '<li>Error loading tasks</li>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task ${task.completed ? 'complete' : 'pending'}`;
    li.innerHTML = `${task.title} <span class="status">${task.completed ? '✔' : '○'}</span>`;
    taskList.appendChild(li);
  });

  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', dummyUserId)
    .single();

  document.getElementById('welcome-name').innerText = 'Welcome, Anele';
  document.getElementById('streak-count').innerText =
    (streakRow?.current_streak || 0) + ' days';
}

loadDashboard();

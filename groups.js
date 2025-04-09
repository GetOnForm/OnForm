const supabaseClient = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);
const dummyUserId = '00000000-0000-0000-0000-000000000001';

async function loadGroups() {
  const { data: groups, error } = await supabaseClient
    .from('groups')
    .select('*')
    .eq('owner_id', dummyUserId);
  const groupsContainer = document.getElementById('groups-container');
  groupsContainer.innerHTML = '';
  if (error || !groups || groups.length === 0) {
    groupsContainer.innerHTML = '<p>No groups found. Create one!</p>';
  } else {
    groups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'group-card';
      card.innerHTML = `<h3>${group.name}</h3><p>${group.description}</p>`;
      groupsContainer.appendChild(card);
    });
  }
}

loadGroups();

document.getElementById('group-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('group-name').value;
  const description = document.getElementById('group-description').value;
  const { data, error } = await supabaseClient
    .from('groups')
    .insert([{ name, description, owner_id: dummyUserId }]);
  if (error) alert('Error creating group: ' + error.message);
  else {
    alert('Group created successfully!');
    loadGroups();
  }
});


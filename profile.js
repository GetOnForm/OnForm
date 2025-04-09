const supabaseClient = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);
const dummyUserId = '00000000-0000-0000-0000-000000000001';

async function loadProfile() {
  const { data: user, error: userError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', dummyUserId)
    .single();
  const profileDetails = document.getElementById('profile-details');
  if (userError || !user) {
    profileDetails.innerHTML = '<p>Error loading profile.</p>';
  } else {
    profileDetails.innerHTML = `<p>Name: ${user.full_name}</p>
                                <p>Email: ${user.email}</p>
                                <p>Phone: ${user.phone_number || 'N/A'}</p>
                                <p>Joined: ${new Date(user.joined_at).toLocaleDateString()}</p>`;
  }
  const { data: passData, error: passError } = await supabaseClient
    .from('performance_passes')
    .select('*')
    .eq('user_id', dummyUserId)
    .single();
  const performanceDetails = document.getElementById('performance-details');
  if (!passError && passData && passData.activated) {
    performanceDetails.innerHTML = `<p>Performance Pass is active. Deposit: R${passData.deposit}. Expires: ${new Date(passData.expires_at).toLocaleDateString()}</p>`;
  } else {
    performanceDetails.innerHTML = `<p>No active Performance Pass. <a href="dashboard.html">Upgrade now</a></p>`;
  }
}

loadProfile();

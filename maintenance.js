//----------------------------------------------------
// maintenance.js
// Example "maintenance" logic for daily/weekly checks 
// and challenge finalization. Uses { data, error }
// de-structuring rather than .catch() on .rpc().
//----------------------------------------------------

const supabaseMaint = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

/**
 * This is called from your dashboard.js to simulate
 * daily checks, weekly checks, challenge finalization, etc.
 */
async function runMaintenance(user) {
  if (!user) return;
  await checkDailyTasks(user);
  await checkWeeklyTasks(user);
  await finalizeChallenges(user);
}

/**
 * Example: check daily tasks & possibly reset streak
 */
async function checkDailyTasks(user) {
  const today = new Date();
  const lastDate = user.last_streak_date ? new Date(user.last_streak_date) : null;
  if (!lastDate) {
    // If never set, set it to today so future logic can proceed
    await supabaseMaint
      .from('users')
      .update({ last_streak_date: today.toISOString().split('T')[0] })
      .eq('id', user.id);
    return;
  }

  // If lastDate < yesterday => user missed a day => reset streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastDate < yesterday) {
    await supabaseMaint
      .from('users')
      .update({
        current_streak: 0,
        last_streak_date: today.toISOString().split('T')[0]
      })
      .eq('id', user.id);
  } else {
    // Otherwise do nothing or more advanced checks
    // e.g., verifying tasks completed for the day
  }
}

/**
 * Example: check weekly tasks (placeholder)
 */
async function checkWeeklyTasks(user) {
  // If it's Monday, check if the user completed last week's tasks
  // For brevity, we skip detailed logic
}

/**
 * Finalize ended challenges:
 * 1) find ended challenges
 * 2) find participants
 * 3) distribute pot if they "won"
 * 4) remove .catch() usage in .rpc()
 */
async function finalizeChallenges(user) {
  // 1) find challenges that ended prior to today
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: endedChallenges, error: challengesErr } = await supabaseMaint
    .from('challenges')
    .select('*')
    .lt('end_date', todayStr);

  if (challengesErr) {
    console.error('Error fetching ended challenges:', challengesErr);
    return;
  }
  if (!endedChallenges || endedChallenges.length === 0) return;

  for (let ch of endedChallenges) {
    // 2) find participants
    const { data: parts, error: partsErr } = await supabaseMaint
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', ch.id);
    if (partsErr) {
      console.error('Error fetching participants for challenge', ch.id, partsErr);
      continue;
    }
    if (!parts || parts.length === 0) continue;

    // sum pot from coins_contributed
    let pot = 0;
    parts.forEach(p => pot += p.coins_contributed);

    // For real logic, you'd check who completed the challenge
    // We'll do a naive approach: everyone "wins"
    const share = parts.length > 0 ? Math.floor(pot / parts.length) : 0;

    for (let p of parts) {
      // Example: use .rpc() to increment coins
      const { data: rpcData, error: rpcErr } = await supabaseMaint.rpc('increment_coins', {
        user_id_input: p.user_id,
        amount_input: share
      });
      if (rpcErr) {
        console.error('increment_coins error for user', p.user_id, rpcErr);
      } else {
        // Log the coin transaction
        const { error: txErr } = await supabaseMaint
          .from('coin_transactions')
          .insert({
            user_id: p.user_id,
            amount: share,
            transaction_type: 'challenge_win',
            reference_id: ch.id
          });
        if (txErr) {
          console.error('coin_transactions insert error:', txErr);
        }
      }
    }

    // set pot=0, set participants => 'completed'
    const { error: potErr } = await supabaseMaint
      .from('challenges')
      .update({ pot: 0 })
      .eq('id', ch.id);
    if (potErr) {
      console.error('Error setting pot=0 for challenge', ch.id, potErr);
    }

    const { error: partStatusErr } = await supabaseMaint
      .from('challenge_participants')
      .update({ status: 'completed' })
      .eq('challenge_id', ch.id);
    if (partStatusErr) {
      console.error('Error updating participant status for challenge', ch.id, partStatusErr);
    }
  }
}

// Expose runMaintenance to global scope if needed
window.runMaintenance = runMaintenance;

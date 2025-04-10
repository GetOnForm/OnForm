const supabaseMaint = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

// This is called each time user loads the dashboard
// to simulate daily checks, weekly checks, challenge finalization
async function runMaintenance(user) {
  if (!user) return;
  await checkDailyTasks(user);
  await checkWeeklyTasks(user);
  await finalizeChallenges(user);
}

// Example daily tasks check
async function checkDailyTasks(user) {
  // Compare user.last_streak_date with today's date
  // If there's 1 or more days gap, see which tasks they missed
  // For brevity, we skip full detail. This logic can be extended.

  const today = new Date();
  const lastDate = user.last_streak_date ? new Date(user.last_streak_date) : null;
  if (!lastDate) {
    // If never set, we'll set it to today's date so future logic can proceed
    await supabaseMaint
      .from('users')
      .update({ last_streak_date: today.toISOString().split('T')[0] })
      .eq('id', user.id);
    return;
  }

  // If lastDate < yesterday, user probably missed at least 1 day
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastDate < yesterday) {
    // For simplicity, reset streak
    await supabaseMaint
      .from('users')
      .update({ current_streak: 0, last_streak_date: today.toISOString().split('T')[0] })
      .eq('id', user.id);
  } else {
    // Possibly increment streak or keep the same. We'll do a simple approach
    // A real approach would check if today's tasks are done by 1am next day
  }
}

// Example weekly tasks check
async function checkWeeklyTasks(user) {
  // For a real check, we'd see if it's Monday and check last week's tasks.
  // We'll skip detailed logic for brevity.
}

// Example challenge finalization
async function finalizeChallenges(user) {
  // Find challenges that ended before today
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: endedChallenges, error } = await supabaseMaint
    .from('challenges')
    .select('*')
    .lt('end_date', todayStr);

  if (!endedChallenges || endedChallenges.length === 0) return;

  for (let ch of endedChallenges) {
    // get participants
    const { data: parts } = await supabaseMaint
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', ch.id);

    if (!parts || parts.length === 0) continue;

    // sum pot from coins_contributed
    let pot = 0;
    parts.forEach(p => pot += p.coins_contributed);

    // naive approach: pick all participants as winners
    // in production, check if they actually completed tasks
    if (parts.length > 0) {
      const share = Math.floor(pot / parts.length);
      for (let p of parts) {
        // increment user total_coins
        await supabaseMaint.rpc('increment_coins', {
          user_id_input: p.user_id,
          amount_input: share
        }).catch(() => {
          // fallback: manual update
        });

        // or do a normal approach:
        // 1. fetch user
        // 2. user.total_coins += share
        // 3. update user
        await supabaseMaint
          .from('coin_transactions')
          .insert({
            user_id: p.user_id,
            amount: share,
            transaction_type: 'challenge_win',
            reference_id: ch.id
          });
      }
    }

    // set pot=0, set participant status=completed
    await supabaseMaint
      .from('challenges')
      .update({ pot: 0 })
      .eq('id', ch.id);

    await supabaseMaint
      .from('challenge_participants')
      .update({ status: 'completed' })
      .eq('challenge_id', ch.id);
  }
}

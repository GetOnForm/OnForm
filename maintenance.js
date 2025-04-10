const supabaseMaint = supabase.createClient(
  'https://feyupwxdyriniiffghkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVwd3hkeXJpbmlpZmZnaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjkwNzUsImV4cCI6MjA1OTU0NTA3NX0.VP6u6mmF9SCx1U6IuQegH-fBA4XSVRGwDQypjjf6Z1A'
);

async function runMaintenance(user) {
  if (!user) return;
  await checkDailyTasks(user);
  await checkWeeklyTasks(user);
  await finalizeChallenges(user);
}

async function checkDailyTasks(user) {
  const today = new Date();
  const lastDate = user.last_streak_date ? new Date(user.last_streak_date) : null;
  if (!lastDate) {
    await supabaseMaint
      .from('users')
      .update({ last_streak_date: today.toISOString().split('T')[0] })
      .eq('id', user.id);
    return;
  }
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
    // Possibly increment if they completed all must-do tasks
    // This is simplified
  }
}

async function checkWeeklyTasks(user) {
  // placeholder
}

async function finalizeChallenges(user) {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: endedChallenges, error } = await supabaseMaint
    .from('challenges')
    .select('*')
    .lt('end_date', todayStr);

  if (!endedChallenges || endedChallenges.length === 0) return;

  for (let ch of endedChallenges) {
    // fetch participants
    const { data: parts } = await supabaseMaint
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', ch.id);
    if (!parts || parts.length === 0) continue;

    let pot = 0;
    parts.forEach(p => pot += p.coins_contributed);

    // naive approach: all participants are winners
    const share = parts.length > 0 ? Math.floor(pot / parts.length) : 0;
    for (let p of parts) {
      const { data: rpcData, error: rpcErr } = await supabaseMaint.rpc('increment_coins', {
        user_id_input: p.user_id,
        amount_input: share
      });
      if (rpcErr) {
        console.error('increment_coins error:', rpcErr);
      } else {
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
    // set pot=0, status=completed
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

window.runMaintenance = runMaintenance;

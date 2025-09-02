const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const cron = require('node-cron');
const leagueManager = require('./leagueManager');

let task = null;
let isRunning = false;

async function runScheduledRefresh() {
  if (isRunning) {
    console.log('[backgroundScheduler] ⏳ Skip run: previous execution still running');
    return;
  }
  isRunning = true;
  console.log('[backgroundScheduler] 🔁 Performing scheduled refresh for configured leagues...');

  try {
    const config = await leagueManager.getLeagueConfiguration();
    const leagues = (config.leagues || []).map(l => l.key);

    // Prioritize Tier 1 first, then Tier 2, then Tier 3
    const tierOrder = { TIER_1: 1, TIER_2: 2, TIER_3: 3 };
    const ordered = (config.leagues || []).sort((a, b) => (tierOrder[a.tier] || 9) - (tierOrder[b.tier] || 9));

    for (const league of ordered) {
      try {
        await leagueManager.refreshLeague(league.key, { rounds: league.roundsToLoad, sliding: true });
      } catch (err) {
        console.error(`[backgroundScheduler] ❌ Refresh failed for ${league.key}:`, err.message);
      }
    }

    console.log('[backgroundScheduler] ✅ Scheduled refresh cycle completed');
  } catch (error) {
    console.error('[backgroundScheduler] ❌ Scheduled refresh error:', error.message);
  } finally {
    isRunning = false;
  }
}

function start() {
  if (task) {
    console.log('[backgroundScheduler] Already started');
    return;
  }

  // Every 6 hours at minute 0
  task = cron.schedule('0 */6 * * *', () => {
    runScheduledRefresh();
  });

  task.start();

  // Kickoff immediate refresh (non-blocking)
  setTimeout(() => runScheduledRefresh(), 2000);

  console.log('[backgroundScheduler] ▶️ Started (cron: 0 */6 * * *)');
}

function stop() {
  if (task) {
    try {
      task.stop();
      task.destroy();
    } catch (_) { /* noop */ }
    task = null;
  }
  console.log('[backgroundScheduler] ⏹️ Stopped');
}

module.exports = { start, stop };



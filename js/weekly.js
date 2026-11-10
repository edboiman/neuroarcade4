// Weekly rotation rules and week-over-week statistics. Pure functions, no DOM.
export const GAME_IDS = ['blockfit', 'cafe', 'survivor', 'estate', 'dungeon'];
// A game counts as overdue (and gets a gentle warning) after this many days without a counted session.
export const OVERDUE_DAYS = 7;
// A session counts toward the week if it was completed, or lasted at least this long.
export const MIN_SESSION_SEC = 60;

export function weekStart(ts) {
  const d = new Date(ts);
  const back = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, 0, 0, 0, 0).getTime();
}
export function shiftWeek(wk, n) {
  const d = new Date(wk);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n, 0, 0, 0, 0).getTime();
}
export const nextWeekStart = (ts) => shiftWeek(weekStart(ts), 1);

export const counted = (s) => s.c === true || s.d >= MIN_SESSION_SEC;

export function sessionsInWeek(sessions, wk) {
  const end = shiftWeek(wk, 1);
  return sessions.filter((s) => s.t >= wk && s.t < end && counted(s));
}

export function rotation(sessions, now) {
  const wk = weekStart(now);
  const list = sessionsInWeek(sessions, wk);
  const counts = {};
  for (const g of GAME_IDS) counts[g] = 0;
  for (const s of list) if (s.g in counts) counts[s.g]++;
  const remaining = GAME_IDS.filter((g) => counts[g] === 0);
  const complete = remaining.length === 0;
  return {
    weekStart: wk,
    nextWeek: shiftWeek(wk, 1),
    counts,
    remaining,
    complete,
    playedCount: GAME_IDS.length - remaining.length,
  };
}

// Last counted session per game (null if never).
export function lastPlayed(sessions) {
  const out = {};
  for (const g of GAME_IDS) out[g] = null;
  for (const s of sessions) if (s.g in out && counted(s) && (out[s.g] === null || s.t > out[s.g])) out[s.g] = s.t;
  return out;
}

// Games with no counted session in OVERDUE_DAYS or more. A never-played game is overdue once the
// player has been using the app that long (measured from their first session). No game is ever blocked.
export function overdue(sessions, now) {
  const DAY = 86400000;
  const first = sessions.reduce((m, s) => (counted(s) && s.t < m ? s.t : m), Infinity);
  if (!Number.isFinite(first)) return [];
  const last = lastPlayed(sessions);
  const out = [];
  for (const g of GAME_IDS) {
    const ref = last[g] ?? first;
    const days = Math.floor((now - ref) / DAY);
    if (days >= OVERDUE_DAYS) out.push({ id: g, days, never: last[g] === null });
  }
  return out.sort((a, b) => b.days - a.days);
}

export function weekComplete(sessions, wk) {
  const list = sessionsInWeek(sessions, wk);
  return GAME_IDS.every((g) => list.some((s) => s.g === g));
}

// Consecutive completed weeks. The current week counts once it is complete;
// an unfinished current week never breaks the streak.
export function streak(sessions, now) {
  let wk = weekStart(now);
  let n = 0;
  if (weekComplete(sessions, wk)) n++;
  wk = shiftWeek(wk, -1);
  while (weekComplete(sessions, wk)) {
    n++;
    wk = shiftWeek(wk, -1);
  }
  return n;
}

// Oldest to newest. Weeks without sessions have n = 0 and null stats.
export function weeklySeries(sessions, gameId, now, weeks = 8) {
  const out = [];
  let wk = shiftWeek(weekStart(now), -(weeks - 1));
  for (let i = 0; i < weeks; i++) {
    const list = sessionsInWeek(sessions, wk).filter((s) => s.g === gameId);
    const n = list.length;
    out.push({
      wk,
      n,
      avg: n ? list.reduce((a, s) => a + s.s, 0) / n : null,
      best: n ? Math.max(...list.map((s) => s.s)) : null,
      level: n ? Math.max(...list.map((s) => s.l)) : null,
    });
    wk = shiftWeek(wk, 1);
  }
  return out;
}

// Percent change of this week's average versus the most recent earlier week that has data.
export function weekDelta(series) {
  if (!series.length) return null;
  const cur = series[series.length - 1];
  if (cur.avg == null) return null;
  for (let i = series.length - 2; i >= 0; i--) {
    if (series[i].avg != null && series[i].avg > 0) {
      return { pct: ((cur.avg - series[i].avg) / series[i].avg) * 100, from: series[i].wk };
    }
  }
  return null;
}

export function daysUntil(ts, now) {
  return Math.max(0, Math.ceil((ts - now) / 86400000));
}

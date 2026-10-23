// One reproducible local daily challenge, also available in airplane mode.
export function dailySeed(id, now = new Date()) {
  const text = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}:${id}`;
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function goalProgress(store, now = Date.now()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  const count = store.sessions().filter(s => s.t >= +d && (s.c || s.d >= 60)).length;
  const goal = Math.max(1, Math.min(7, Math.round(store.pref('arcade', 'goal', 3))));
  return { count, goal, complete: count >= goal };
}

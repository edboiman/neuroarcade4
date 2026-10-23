export function scheduleReview(previous, correct, now = Date.now()) {
  const last = previous || { interval: 0, due: 0, last: 0 };
  const interval = correct ? Math.min(60, last.interval ? last.interval < 3 ? 3 : Math.round(last.interval * 2.1) : 1) : 0;
  return { interval, due: now + (correct ? interval * 86400000 : 10 * 60000), last: now };
}
export function reviewOrder(ids, box, reviews = {}, now = Date.now()) {
  return [...ids].sort((a,b) => ((reviews[a]?.due || 0) > now) - ((reviews[b]?.due || 0) > now) || (reviews[a]?.due || 0) - (reviews[b]?.due || 0) || box[a] - box[b]);
}

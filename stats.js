// Progress screen: week-over-week scores per game, rotation history, check-in trends.
import { h, s, icon, fmtNum, fmtDay, fmtTime } from './ui.js';
import { GAMES } from './registry.js';
import { store } from './store.js';
import { rotation, streak, weeklySeries, weekDelta, weekComplete, weekStart, shiftWeek, sessionsInWeek, overdue } from './weekly.js';
import { goalProgress } from './session.js';

// Line chart that breaks at weeks with no data.
export function lineChart(values, { w = 300, hgt = 90, color = '#4db4ff', pad = 8, label = 'Trend', fillOpacity = 0.14 } = {}) {
  const svg = s('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'chart', role: 'img', 'aria-label': label, preserveAspectRatio: 'none' });
  const real = values.filter((v) => v != null);
  if (!real.length) return svg;
  let lo = Math.min(...real);
  let hi = Math.max(...real);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const n = values.length;
  const x = (i) => pad + (n === 1 ? (w - 2 * pad) / 2 : (i * (w - 2 * pad)) / (n - 1));
  const y = (v) => hgt - pad - ((v - lo) / (hi - lo)) * (hgt - 2 * pad);
  // baseline
  svg.append(s('line', { x1: pad, y1: hgt - pad, x2: w - pad, y2: hgt - pad, stroke: 'rgba(255,255,255,.12)', 'stroke-width': 1 }));
  let seg = [];
  const flush = () => {
    if (seg.length >= 2) {
      const d = seg.map(([px, py], k) => (k ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1)).join(' ');
      svg.append(s('path', { d: d + ` L${seg[seg.length - 1][0].toFixed(1)} ${hgt - pad} L${seg[0][0].toFixed(1)} ${hgt - pad} Z`, fill: color, opacity: fillOpacity }));
      svg.append(s('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
    }
    seg = [];
  };
  values.forEach((v, i) => {
    if (v == null) flush();
    else seg.push([x(i), y(v)]);
  });
  flush();
  values.forEach((v, i) => {
    if (v != null) svg.append(s('circle', { cx: x(i), cy: y(v), r: i === n - 1 ? 4.5 : 3, fill: i === n - 1 ? color : '#05060a', stroke: color, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
  });
  return svg;
}

function deltaChip(d, lowerBetter = false) {
  if (!d) return h('span', { class: 'chip muted' }, 'No earlier week to compare');
  const pct = Math.round(d.pct);
  if (pct === 0) return h('span', { class: 'chip' }, 'Level with last week');
  const better = lowerBetter ? pct < 0 : pct > 0;
  return h('span', { class: 'chip ' + (better ? 'good' : 'warn') }, (pct > 0 ? 'Up ' : 'Down ') + Math.abs(pct) + '% vs last week');
}

export function mountStats(root, ctx) {
  const now = Date.now();
  const sessions = store.sessions();
  const rot = rotation(sessions, now);
  const st = streak(sessions, now);
  const total = sessions.length;
  const goal = goalProgress(store,now);
  let goalStreak=0, cursor=weekStart(now);
  if(sessionsInWeek(sessions,cursor).length>=goal.goal)goalStreak++;
  cursor=shiftWeek(cursor,-1);
  while(sessionsInWeek(sessions,cursor).length>=goal.goal){goalStreak++;cursor=shiftWeek(cursor,-1);}

  const tile = (value, label) => h('div', { class: 'tile' }, h('strong', null, String(value)), h('span', null, label));
  const tiles = h(
    'div',
    { class: 'tiles' },
    tile(goalStreak, 'weeks meeting your goal'),
    tile(GAMES.reduce((n, g) => n + rot.counts[g.id], 0), 'sessions this week'),
    tile(total, 'sessions in total'),
  );

  // rotation history
  const weeks = [];
  for (let i = 7; i >= 0; i--) weeks.push(shiftWeek(weekStart(now), -i));
  const hist = h(
    'div',
    { class: 'rot-hist', role: 'img', 'aria-label': 'Rotation history for the last 8 weeks' },
    weeks.map((wk, i) => {
      const cur = i === weeks.length - 1;
      const done = sessionsInWeek(sessions,wk).length>=goal.goal;
      const any = sessionsInWeek(sessions, wk).length > 0;
      return h(
        'div',
        { class: 'rh' + (done ? ' done' : any ? ' part' : '') + (cur ? ' cur' : '') },
        h('span', { class: 'rh-dot' }, done ? icon('check', 14) : null),
        h('span', { class: 'rh-lbl' }, cur ? 'Now' : fmtDay(wk)),
      );
    }),
  );

  // per-game rows
  const rows = GAMES.map((g) => {
    const gameSessions = sessions.filter(x=>x.g===g.id);
    const latestMode=gameSessions[gameSessions.length-1]?.mode || 'standard';
    const comparable=gameSessions.filter(x=>(x.mode||'standard')===latestMode);
    const series = weeklySeries(comparable, g.id, now, 8);
    const cur = series[series.length - 1];
    const d = weekDelta(series);
    const all = comparable;
    const bestEver = all.reduce((m, x) => Math.max(m, x.s), 0);
    const detail = h('div', { class: 'row-detail', hidden: true });
    const head = h(
      'button',
      { class: 'row-head', type: 'button', 'aria-expanded': 'false' },
      h('span', { class: 'row-dot', style: { background: g.accent } }),
      h(
        'span',
        { class: 'row-main' },
        h('strong', null, g.name),
        h('span', { class: 'row-sub' }, all.length ? `${all.length} ${all.length === 1 ? 'session' : 'sessions'}, best ${fmtNum(bestEver)}` : 'Not played yet'),
      ),
      h('span', { class: 'row-spark' }, lineChart(series.map((w) => w.avg), { w: 120, hgt: 40, pad: 5, color: g.accent, label: g.name + ' weekly average' })),
    );
    head.addEventListener('click', () => {
      const open = detail.hidden;
      detail.hidden = !open;
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !detail.childElementCount) fillDetail(detail, g, series, d, all);
    });
    return h('div', { class: 'row' }, head, detail);
  });

  function fillDetail(el, g, series, d, all) {
    el.append(
      h('div', { class: 'detail-top' }, deltaChip(d), h('span', { class: 'detail-note' }, 'Equivalent rules only · weekly averages, last 8 weeks')),
      lineChart(series.map((w) => w.avg), { w: 320, hgt: 110, pad: 10, color: g.accent, label: g.name + ' weekly average score' }),
      h(
        'table',
        { class: 'wk-table' },
        h('thead', null, h('tr', null, ['Week of', 'Plays', 'Average', 'Best', 'Level'].map((t) => h('th', { scope: 'col' }, t)))),
        h(
          'tbody',
          null,
          [...series].reverse().filter((w) => w.n > 0).slice(0, 8).map((w) =>
            h('tr', null, h('td', null, fmtDay(w.wk)), h('td', null, String(w.n)), h('td', null, fmtNum(w.avg)), h('td', null, fmtNum(w.best)), h('td', null, String(w.level))),
          ),
        ),
      ),
      all.length === 0 ? h('p', { class: 'empty' }, 'Play this game to see your first week appear here.') : null,
      all.length
        ? h(
            'div',
            { class: 'recent' },
            h('h4', null, 'Latest sessions'),
            all.slice(-6).reverse().map((x) =>
              h('div', { class: 'recent-row' }, h('span', null, fmtDay(x.t) + ', ' + fmtTime(x.t)), h('strong', null, fmtNum(x.s)), h('span', { class: 'muted' }, x.a != null ? Math.round(x.a * 100) + '% accuracy' : 'Level ' + x.l)),
            ),
          )
        : null,
    );
  }

  // check-in trends
  const cis = store.checkins();
  const rtVals = cis.slice(-10).map((c) => c.rt);
  const spVals = cis.slice(-10).map((c) => c.sp);
  const last = cis[cis.length - 1];
  const first = cis[0];
  const checkSection = h(
    'section',
    { class: 'block' },
    h('h2', null, 'Check-in trends'),
    cis.length === 0
      ? h('p', { class: 'empty' }, 'The Check-in takes about a minute and measures reaction time and short-term memory with tasks the games never train. Use it to track performance on these tasks over time.')
      : h(
          'div',
          { class: 'ci-grid' },
          h(
            'div',
            { class: 'ci' },
            h('span', { class: 'ci-lbl' }, 'Reaction time'),
            h('strong', null, last.rt != null ? Math.round(last.rt) + ' ms' : 'n/a'),
            lineChart(rtVals, { w: 150, hgt: 56, pad: 6, color: '#ff9a5c', label: 'Reaction time trend, lower is better' }),
            h('span', { class: 'ci-note' }, first !== last && first.rt != null && last.rt != null ? `${Math.round(first.rt)} ms at the start. Lower is faster.` : 'Lower is faster.'),
          ),
          h(
            'div',
            { class: 'ci' },
            h('span', { class: 'ci-lbl' }, 'Digit span'),
            h('strong', null, last.sp != null ? last.sp + ' digits' : 'n/a'),
            lineChart(spVals, { w: 150, hgt: 56, pad: 6, color: '#b794ff', label: 'Digit span trend, higher is better' }),
            h('span', { class: 'ci-note' }, first !== last && first.sp != null && last.sp != null ? `${first.sp} digits at the start. Higher is better.` : 'Higher is better.'),
          ),
        ),
    h('p', { class: 'fine' }, 'Everyday fluctuation is normal. Look at the trend over several weeks, not a single result.'),
  );

  const el = h(
    'div',
    { class: 'screen page' },
    h('header', { class: 'page-top' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => history.back() }, icon('back', 24)), h('h1', null, 'Progress')),
    h(
      'div',
      { class: 'page-body' },
      tiles,
      h('section', { class: 'block' }, h('h2', null, 'Your weekly rhythm'), hist, h('p', { class: 'fine' }, `${goal.count} of ${goal.goal} sessions this week. Any game counts. History uses your current weekly goal.`), store.settings().reminders ? h('p',{class:'fine'},'Something to revisit: '+(overdue(sessions,now).map(x=>GAMES.find(g=>g.id===x.id).name).join(', ')||'Your games are all up to date.')) : null),
      h('section', { class: 'block' }, h('h2', null, 'Games, week over week'), h('div', { class: 'rows' }, rows)),
      checkSection,
    ),
  );
  root.append(el);
  return { destroy() {} };
}

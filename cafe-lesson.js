// Lingo Café, learn phase: meet a few new words with their pictures, then a short match quiz,
// before the customers start ordering them. Also used for a quick review of older words.
import { ITEMS, itemById, sentence, englishLine, NUMS } from './cafe-data.js';
import { sceneById } from './lingo-scenes.js';
import { h, haptic, fill } from '../ui.js';
import { mulberry32, shuffle } from './rng.js';
import { itemArt } from './item-art.js';

// Builds the quiz questions: every word once picture-to-word and once word-to-picture, mixed.
export function buildQuiz(ids, rnd) {
  const q = [];
  for (const id of ids) {
    q.push({ id, dir: 'word2pic' });
    q.push({ id, dir: 'pic2word' });
  }
  return shuffle(rnd, q);
}

// Four choices including the answer. Words from today's list first, topped up from the rest.
// `menu` limits the extra choices to one scenario, so two choices never share a picture.
export function choicesFor(id, ids, rnd, n = 4, menu = null) {
  const pool = ids.filter((x) => x !== id);
  const pics = new Set([id, ...pool].map((x) => itemById(x).emoji));
  const extra = shuffle(
    rnd,
    (menu || ITEMS.map((x) => x.id)).filter((x) => x !== id && !pool.includes(x) && !pics.has(itemById(x).emoji)),
  );
  const picks = shuffle(rnd, pool).slice(0, n - 1);
  for (const x of extra) {
    if (picks.length >= n - 1) break;
    picks.push(x);
  }
  return shuffle(rnd, [id, ...picks]);
}

// opts: { root, lang, ids, teach, shift, ctx, onDone({ missed:[ids], firstTry, total }) }
export function runLesson({ root, lang, ids, teach, shift, ctx, onDone, scene = 'cafe' }) {
  const sc = sceneById(scene);
  const rnd = mulberry32((Date.now() ^ 0x2545f491) & 0x7fffffff);
  const panel = h('div', { class: 'cf-lesson' });
  root.append(panel);
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const L = lang.id;
  const word = (id) => itemById(id)[L].noun;

  // ----- step 1: meet the words -----
  const cards = ids.map((id) => ({ kind: 'word', id }));
  if (teach && shift === 3) cards.push({ kind: 'numbers' });
  let ci = 0;

  function steps(n) {
    return h('div', { class: 'cl-steps', 'aria-hidden': 'true' }, [1, 2].map((i) => h('i', { class: i <= n ? 'on' : '' })));
  }

  function showCard() {
    const c = cards[ci];
    const last = ci === cards.length - 1;
    let body;
    if (c.kind === 'numbers') {
      body = h('div', { class: 'cl-card' }, h('div', { class: 'cl-emoji' }, '2️⃣ 3️⃣'), h('div', { class: 'cl-word', lang: L }, `${NUMS[L][2]} = 2`), h('div', { class: 'cl-word', lang: L }, `${NUMS[L][3]} = 3`), h('div', { class: 'cl-en' }, 'Customers now order more than one of something.'));
    } else {
      const x = itemById(c.id);
      const ex = sentence(L, [{ id: c.id, qty: 1 }], 0, sc.id);
      body = h(
        'div',
        { class: 'cl-card' },
        h('div', { class: 'cl-emoji' }, itemArt(c.id)),
        h('div', { class: 'cl-word', lang: L }, x[L].noun),
        h('div', { class: 'cl-en' }, x.en),
        h('div', { class: 'cl-ex' }, h('span', { lang: L }, `“${ex}”`), h('small', null, englishLine([{ id: c.id, qty: 1 }], 0, sc.id))),
      );
    }
    fill(
      panel,
      steps(1),
      h('h2', null, 'Meet the words'),
      h('p', { class: 'cl-sub' }, `${ci + 1} of ${cards.length}. Read it, say it out loud, then continue.`),
      body,
      h('button', { class: 'btn primary', type: 'button', onclick: () => (last ? startQuiz() : (ci++, showCard())) }, last ? 'Test me' : 'Next'),
      h('button', { class: 'cl-skip', type: 'button', onclick: () => done({ missed: [], firstTry: 0, total: 0, skipped: true }) }, 'I already know these'),
    );
  }

  // ----- step 2: match quiz -----
  let queue = [];
  let qi = 0;
  const firstMiss = new Set();
  const retries = {};
  let asked = 0;
  let firstTryRight = 0;
  let totalFirst = 0;
  let locked = false;

  function startQuiz() {
    queue = buildQuiz(ids, rnd);
    totalFirst = queue.length;
    qi = 0;
    showQuestion();
  }

  function showQuestion() {
    if (qi >= queue.length) return finish();
    locked = false;
    const q = queue[qi];
    const x = itemById(q.id);
    const opts = choicesFor(q.id, ids, rnd, 4, sc.items);
    const prompt =
      q.dir === 'word2pic' ? h('div', { class: 'cl-prompt', lang: L }, x[L].noun) : h('div', { class: 'cl-prompt big', role:'img', 'aria-label':x.en }, itemArt(q.id));
    const hint = q.dir === 'word2pic' ? 'Which one is it?' : 'What is this called?';
    const grid = h(
      'div',
      { class: 'cl-grid' },
      opts.map((id) => {
        const o = itemById(id);
        const b = h(
          'button',
          { class: 'cl-opt' + (q.dir === 'word2pic' ? ' pic' : ''), type: 'button', 'aria-label':q.dir==='word2pic'?o.en:o[L].noun, lang: q.dir === 'word2pic' ? null : L, onclick: () => answer(q, id, b, grid) },
          q.dir === 'word2pic' ? itemArt(id) : o[L].noun,
        );
        b.dataset.id = id;
        return b;
      }),
    );
    fill(
      panel,
      steps(2),
      h('h2', null, 'Match them up'),
      h('p', { class: 'cl-sub' }, `${Math.min(qi + 1, totalFirst)} of ${totalFirst}${queue.length > totalFirst ? ' (plus retries)' : ''}`),
      prompt,
      h('p', { class: 'cl-hint' }, hint),
      grid,
    );
  }

  function answer(q, id, btn, grid) {
    if (locked) return;
    locked = true;
    asked++;
    const right = id === q.id;
    const isFirst = qi < totalFirst;
    if (right) {
      btn.classList.add('right');
      ctx.audio.good();
      haptic(10);
      if (isFirst && !firstMiss.has(q.id + q.dir)) firstTryRight++;
      later(() => {
        qi++;
        showQuestion();
      }, 650);
    } else {
      btn.classList.add('wrong');
      grid.querySelector(`[data-id="${q.id}"]`).classList.add('right');
      ctx.audio.bad();
      haptic(25);
      firstMiss.add(q.id);
      firstMiss.add(q.id + q.dir);
      const x = itemById(q.id);
      grid.after(h('p', { class: 'cl-fix' }, h('span', { lang: L }, x[L].noun), ` means ${x.en}.`));
      retries[q.id] = (retries[q.id] || 0) + 1;
      if (retries[q.id] <= 2) queue.push({ id: q.id, dir: q.dir });
      later(() => {
        qi++;
        showQuestion();
      }, 1700);
    }
  }

  function finish() {
    const missed = ids.filter((id) => firstMiss.has(id));
    const perfect = !missed.length;
    fill(
      panel,
      steps(2),
      h('h2', null, teach ? 'Ready for the rush' : 'Nice review'),
      h('p', { class: 'cl-sub' }, `${firstTryRight} of ${totalFirst} right on the first try.`),
      h('div', { class: 'cl-done' }, ids.map((id) => h('span', { class: 'cl-chip' + (firstMiss.has(id) ? ' miss' : '') }, itemById(id).emoji, ' ', h('b', { lang: L }, word(id))))),
      h('p', { class: 'cl-sub' }, teach ? (perfect ? 'You have all of them. Now serve them as customers order.' : 'The ones in red will keep their labels on the tray until they stick.') : 'Words you got wrong will come back sooner.'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => done({ missed, firstTry: firstTryRight, total: totalFirst }) }, teach ? 'Open the café' : 'Back'),
    );
  }

  function done(result) {
    destroy();
    onDone(result);
  }
  function destroy() {
    for (const t of timers) clearTimeout(t);
    timers.clear();
    panel.remove();
  }

  if (teach) showCard();
  else startQuiz();
  return { destroy };
}

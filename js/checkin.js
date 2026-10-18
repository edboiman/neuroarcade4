// Weekly check-in: two short tasks the games never train (simple reaction time, digit span).
// They give an honest read on whether anything outside the games is changing.
import { h, icon, toast, haptic } from './ui.js';
import { store } from './store.js';

export const median = (a) => {
  const b = [...a].sort((x, y) => x - y);
  const m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
};

// Digit span staircase: start at 3, +1 on success, stop after two misses at one length.
export function createSpan(rng = Math.random) {
  const st = { len: 3, misses: 0, best: 0, done: false };
  st.make = () => Array.from({ length: st.len }, () => Math.floor(rng() * 10));
  st.answer = (ok) => {
    if (ok) {
      st.best = Math.max(st.best, st.len);
      st.len++;
      st.misses = 0;
      if (st.len > 12) st.done = true;
    } else if (++st.misses >= 2) st.done = true;
  };
  return st;
}

export function mountCheckin(root, ctx) {
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  let alive = true;
  const stage = h('div', { class: 'ci-stage' });
  const el = h(
    'div',
    { class: 'screen page ci-screen' },
    h('header', { class: 'page-top' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => history.back() }, icon('back', 24)), h('h1', null, 'Weekly check-in')),
    stage,
  );
  root.append(el);

  const result = { rt: null, sp: null };

  function intro() {
    stage.replaceChildren(
      h(
        'div',
        { class: 'ci-card' },
        h('h2', null, 'Two quick tasks'),
        h('p', null, 'About one minute. First, tap as fast as you can when the screen turns green. Then repeat strings of digits back from memory.'),
        h('p', { class: 'fine' }, 'These are not part of any game, so changes here show whether practice carries over. Try to do it at a similar time of day.'),
        h('button', { class: 'btn primary', type: 'button', onclick: reaction }, 'Begin'),
      ),
    );
  }

  // ----- reaction time -----
  function reaction() {
    const times = [];
    const total = 5;
    const pad = h('button', { class: 'rt-pad wait', type: 'button' });
    const msg = h('div', { class: 'rt-msg' });
    const count = h('div', { class: 'rt-count' });
    pad.append(msg);
    stage.replaceChildren(pad, count);
    let state = 'idle';
    let t0 = 0;
    let timer = 0;

    function arm() {
      if (!alive) return;
      state = 'wait';
      pad.className = 'rt-pad wait';
      msg.textContent = 'Wait for green';
      count.textContent = `Trial ${times.length + 1} of ${total}`;
      timer = later(() => {
        state = 'go';
        pad.className = 'rt-pad go';
        msg.textContent = 'Tap now';
        t0 = performance.now();
      }, 1200 + Math.random() * 2600);
    }
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state === 'wait') {
        clearTimeout(timer);
        timers.delete(timer);
        state = 'early';
        pad.className = 'rt-pad early';
        msg.textContent = 'Too soon. Tap to retry';
      } else if (state === 'early' || state === 'idle') {
        arm();
      } else if (state === 'go') {
        const rt = performance.now() - t0;
        times.push(rt);
        haptic(10);
        if (times.length >= total) {
          result.rt = median(times);
          state = 'done';
          pad.className = 'rt-pad done';
          msg.textContent = Math.round(result.rt) + ' ms median';
          later(span, 1300);
        } else {
          state = 'between';
          pad.className = 'rt-pad done';
          msg.textContent = Math.round(rt) + ' ms';
          later(arm, 900);
        }
      }
    });
    state = 'idle';
    pad.className = 'rt-pad idle';
    msg.textContent = 'Tap to start';
    count.textContent = 'Reaction time';
  }

  // ----- digit span -----
  function span() {
    if (!alive) return;
    const sp = createSpan();
    const display = h('div', { class: 'sp-display', 'aria-live': 'polite' });
    const entry = h('div', { class: 'sp-entry' });
    const prompt = h('p', { class: 'sp-prompt' });
    const keys = h('div', { class: 'keypad' });
    stage.replaceChildren(h('div', { class: 'sp-wrap' }, prompt, display, entry, keys));
    let seq = [];
    let typed = [];
    let accepting = false;

    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Enter'].forEach((k) => {
      const b = h('button', { class: 'key' + (k.length > 1 ? ' wide' : ''), type: 'button', disabled: true }, k);
      b.addEventListener('click', () => press(k));
      keys.append(b);
    });
    const setKeys = (on) => keys.querySelectorAll('button').forEach((b) => (b.disabled = !on));

    function press(k) {
      if (!accepting) return;
      haptic(6);
      if (k === 'Clear') typed = [];
      else if (k === 'Enter') return submit();
      else if (typed.length < seq.length) typed.push(Number(k));
      entry.textContent = typed.join(' ') || ' ';
      if (typed.length === seq.length) later(submit, 150);
    }
    function submit() {
      if (!accepting) return;
      accepting = false;
      setKeys(false);
      const ok = typed.length === seq.length && typed.every((d, i) => d === seq[i]);
      display.textContent = ok ? 'Correct' : 'Not quite';
      display.className = 'sp-display ' + (ok ? 'ok' : 'bad');
      sp.answer(ok);
      later(sp.done ? finish : round, 1000);
    }
    function round() {
      if (!alive) return;
      seq = sp.make();
      typed = [];
      entry.textContent = ' ';
      display.className = 'sp-display';
      prompt.textContent = `Remember ${seq.length} digits`;
      let i = 0;
      const show = () => {
        if (!alive) return;
        if (i < seq.length) {
          display.textContent = String(seq[i++]);
          later(() => {
            display.textContent = ' ';
            later(show, 250);
          }, 800);
        } else {
          prompt.textContent = 'Enter the digits in order';
          display.textContent = '?';
          accepting = true;
          setKeys(true);
        }
      };
      later(show, 700);
    }
    function finish() {
      result.sp = sp.best;
      store.addCheckin(result);
      stage.replaceChildren(
        h(
          'div',
          { class: 'ci-card' },
          h('h2', null, 'Check-in saved'),
          h('p', null, `Reaction time: ${Math.round(result.rt)} ms. Digit span: ${result.sp} ${result.sp === 1 ? 'digit' : 'digits'}.`),
          h('p', { class: 'fine' }, 'See how these move over several weeks in Progress.'),
          h('button', { class: 'btn primary', type: 'button', onclick: () => history.back() }, 'Done'),
        ),
      );
      toast('Check-in saved.');
    }
    round();
  }

  intro();
  return {
    destroy() {
      alive = false;
      for (const t of timers) clearTimeout(t);
      timers.clear();
    },
  };
}

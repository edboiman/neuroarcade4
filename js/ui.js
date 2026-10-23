// Small DOM helpers. Text is always inserted with textContent / text nodes, never as HTML.
import { store } from './store.js';

const SVGNS = 'http://www.w3.org/2000/svg';

function addKids(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
}

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  addKids(el, kids);
  return el;
}

export function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, String(v));
    }
  }
  addKids(el, kids);
  return el;
}

// Like replaceChildren, but accepts arrays and skips null/false, the way h() does.
export function fill(el, ...kids) {
  el.replaceChildren();
  addKids(el, kids);
  return el;
}
export const clear = (el) => el.replaceChildren();

const ICONS = {
  stats: [['path', { d: 'M5 20V11M12 20V4M19 20v-6' }]],
  pulse: [['path', { d: 'M2 12h4l3-8 5 16 3-8h5' }]],
  sliders: [
    ['path', { d: 'M4 7h9M17 7h3M4 17h3M11 17h9' }],
    ['circle', { cx: 15, cy: 7, r: 2 }],
    ['circle', { cx: 9, cy: 17, r: 2 }],
  ],
  back: [['path', { d: 'M15 5l-7 7 7 7' }]],
  alert: [
    ['path', { d: 'M12 3l10 18H2z' }],
    ['path', { d: 'M12 10v5M12 18v.5' }],
  ],
  check: [['path', { d: 'M5 13l4 4L19 7' }]],
  play: [['path', { d: 'M8 5v14l11-7z', fill: 'currentColor' }]],
  pause: [['path', { d: 'M8 5v14M16 5v14' }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  left: [['path', { d: 'M14 6l-6 6 6 6' }]],
  right: [['path', { d: 'M10 6l6 6-6 6' }]],
  rotate: [
    ['path', { d: 'M20 11a8 8 0 1 0-2.3 5.7' }],
    ['path', { d: 'M20 4v7h-7' }],
  ],
  down: [['path', { d: 'M6 5l6 6 6-6M6 13l6 6 6-6' }]],
  hold: [
    ['rect', { x: 5, y: 5, width: 14, height: 14, rx: 3 }],
    ['path', { d: 'M9 12h6' }],
  ],
};

export function icon(name, size = 24) {
  const svg = s('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  for (const [tag, attrs] of ICONS[name] || []) svg.append(s(tag, attrs));
  return svg;
}

let toastTimer = 0;
export function toast(msg, ms = 2400) {
  const root = document.getElementById('app');
  if (!root) return;
  let t = root.querySelector('.toast');
  if (!t) {
    t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    root.append(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// Dialog. actions: [{label, value, kind}] kind: 'primary' | 'danger' | undefined.
export function modal({ title, body, actions, dismissible = true }) {
  const root = document.getElementById('app');
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const close = (v) => {
      document.removeEventListener('keydown', onKey, true);
      back.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(v);
    };
    const onKey = (e) => {
      if(e.key==='Tab'){const first=btns[0],last=btns[btns.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        close(null);
      }
    };
    const btns = (actions || [{ label: 'OK', value: true, kind: 'primary' }]).map((a) =>
      h('button', { class: 'btn ' + (a.kind || ''), type: 'button', onclick: () => close(a.value) }, a.label),
    );
    const box = h(
      'div',
      { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', { class: 'modal-title' }, title),
      h('div', { class: 'modal-body' }, body),
      h('div', { class: 'modal-actions' }, btns),
    );
    const back = h('div', { class: 'modal-back', onclick: (e) => e.target === back && dismissible && close(null) }, box);
    root.append(back);
    document.addEventListener('keydown', onKey, true);
    (btns[btns.length - 1] || box).focus();
  });
}

export function haptic(ms = 10) {
  try {
    if (store.settings().haptics && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

export const fmtNum = (n) => Math.round(n).toLocaleString();
export const fmtDay = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

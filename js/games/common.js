// Shared in-game chrome: top bar and overlay cards (ready, pause, how-to).
import { h, icon } from '../ui.js';

export function gameTop({ title, onMenu, right }) {
  return h(
    'header',
    { class: 'game-top' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Pause menu', onclick: onMenu }, icon('pause', 22)),
    h('strong', { class: 'game-title' }, title),
    right || h('span', { class: 'game-top-spacer' }),
  );
}

export function hud(label, initial = '0') {
  const value = h('b', null, initial);
  const el = h('span', { class: 'hud' }, value, h('i', null, label));
  return { el, set: (v) => (value.textContent = String(v)) };
}

// buttons: [{label, kind, onclick}]. Returns {el, close}.
export function overlay(parent, { title, body, buttons }) {
  const previousFocus = document.activeElement;
  let closed = false;
  const close = () => { if(closed)return;closed=true;el.remove();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true}); };
  const el = h(
    'div',
    { class: 'game-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h(
      'div',
      { class: 'go-card' },
      h('h2', null, title),
      body ? h('div', { class: 'go-body' }, body) : null,
      h(
        'div',
        { class: 'go-actions' },
        buttons.map((b) =>
          h(
            'button',
            {
              class: 'btn ' + (b.kind || ''),
              type: 'button',
              onclick: () => {
                if (b.close !== false) close();
                b.onclick && b.onclick();
              },
            },
            b.label,
          ),
        ),
      ),
    ),
  );
  el.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...el.querySelectorAll('button:not(:disabled),[tabindex="0"]')];if(!buttons.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  parent.append(el);
  const first = el.querySelector('button:last-child');
  if (first) first.focus({ preventScroll: true });
  return { el, close };
}

export const mmss = (ms) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};

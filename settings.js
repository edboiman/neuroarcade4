import { h, icon, modal, toast } from './ui.js';
import { store } from './store.js';
import { VERSION } from './version.js';
import { OVERDUE_DAYS } from './weekly.js';
import { GAMES } from './registry.js';

export function mountSettings(root, ctx) {
  const toggle = (key, title, desc) => {
    const sw = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!store.settings()[key]), 'aria-label': title });
    sw.addEventListener('click', () => {
      const v = !store.settings()[key];
      store.setSetting(key, v);
      sw.setAttribute('aria-checked', String(v));
    });
    return h('div', { class: 'set-row' }, h('div', { class: 'set-text' }, h('strong', null, title), h('span', null, desc)), sw);
  };

  const offline = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
  const status = h(
    'div',
    { class: 'status-card' },
    h('span', { class: 'status-dot ' + (offline ? 'ok' : 'warn') }),
    h(
      'div',
      null,
      h('strong', null, offline ? 'Ready to play offline' : 'Offline copy not ready yet'),
      h('p', null, offline ? 'Every game is stored on this phone. Airplane mode is fine.' : 'Open the app once while online and let it finish loading. It then works without a connection.'),
    ),
  );

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', 'aria-label': 'Choose a backup file' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (f.size > 1500000) return toast('That file is too large to be a backup.');
    const ok = await modal({
      title: 'Replace your progress?',
      body: h('p', null, 'Importing replaces all current scores and settings on this phone with the contents of the backup.'),
      actions: [{ label: 'Cancel', value: false }, { label: 'Replace', value: true, kind: 'danger' }],
    });
    if (!ok) return;
    const text = await f.text();
    const res = store.importText(text);
    toast(res.ok ? `Imported ${res.sessions} sessions.` : res.error, 3500);
  });

  const exportBtn = h('button', { class: 'btn', type: 'button' }, 'Export backup');
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([store.exportText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neuro-arcade-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Backup saved to your downloads.');
  });

  const resetBtn = h('button', { class: 'btn danger', type: 'button' }, 'Erase all progress');
  resetBtn.addEventListener('click', async () => {
    const ok = await modal({
      title: 'Erase everything?',
      body: h('p', null, 'This deletes every score, check-in, learning progress and saved game on this phone. It cannot be undone. Export a backup first if you might want it later.'),
      actions: [{ label: 'Keep my data', value: false }, { label: 'Erase all', value: true, kind: 'danger' }],
    });
    if (ok) {
      store.reset();
      toast('All progress erased.');
    }
  });

  const updateBtn = ctx.updateReady()
    ? h('div', { class: 'set-row' }, h('div', { class: 'set-text' }, h('strong', null, 'Update ready'), h('span', null, 'A newer version is downloaded. Restart to use it.')), h('button', { class: 'btn primary', type: 'button', onclick: () => ctx.applyUpdate() }, 'Restart'))
    : null;

  const el = h(
    'div',
    { class: 'screen page' },
    h('header', { class: 'page-top' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => history.back() }, icon('back', 24)), h('h1', null, 'Settings')),
    h(
      'div',
      { class: 'page-body' },
      status,
      updateBtn,
      h(
        'section',
        { class: 'block' },
        h('h2', null, 'Play'),
        toggle('saver', 'Battery saver', 'Caps animation at 30 frames per second and lowers graphics resolution. On by default.'),
        toggle('sound', 'Sound', 'Game tones and small effects.'),
        toggle('haptics', 'Vibration', 'Short buzzes on swipes and game events.'),
        toggle('reduce', 'Reduce motion', 'Removes transitions, screen shake, and decorative animation.'),
        toggle('largeText', 'Larger text', 'Larger instructions, menus, and interface text.'),
      ),
      h(
        'section',
        { class: 'block' },
        h('h2', null, 'Your weekly goal'),
        h('p', { class: 'fine' }, 'Pick a comfortable number of sessions. Play any games you enjoy. A completed game or a minute of active play counts.'),
        h('div', { class: 'theme-chips', role: 'group', 'aria-label': 'Sessions per week' }, [1,2,3,4,5,6,7].map(n => h('button', {class:'theme-chip' + (store.pref('arcade','goal',3)===n?' on':''), type:'button', 'aria-pressed':String(store.pref('arcade','goal',3)===n), onclick:e=>{store.setPref('arcade','goal',n);const parent=e.currentTarget.parentElement; for(const b of parent.children){b.classList.toggle('on', b===e.currentTarget);b.setAttribute('aria-pressed',String(b===e.currentTarget));}}},String(n)))),
        toggle('reminders', 'Variety reminders', 'Show optional suggestions on the progress screen for games you have not played recently.'),
      ),
      h(
        'section',
        { class: 'block' },
        h('h2', null, 'Your data'),
        h('p', { class: 'fine' }, 'All scores live only on this phone. The app makes no network requests, has no accounts, and asks for no permissions. Back up before clearing browser data or changing phones.'),
        h('div', { class: 'btn-row' }, exportBtn, h('button', { class: 'btn', type: 'button', onclick: () => fileInput.click() }, 'Import backup'), fileInput),
        h('div', { class: 'btn-row' }, resetBtn),
        store.persistFailed ? h('p', { class: 'fine warn-text' }, 'This browser is not saving data (private mode or full storage). Progress will be lost when you close the app.') : null,
      ),
      h(
        'section',
        { class: 'block' },
        h('h2', null, 'About'),
        h('p', { class: 'fine' }, 'Neuro Arcade is engaging mental exercise. Studies show training reliably improves the trained skill, while transfer to everyday thinking is modest and debated. It is not a medical treatment.'),
        h('p', { class: 'fine' }, 'Version ' + VERSION),
      ),
    ),
  );
  root.append(el);
  return { destroy() {} };
}

// Lingo Café: touch UI for cafe-core.js. Read the order in the language you are learning, serve the right items.
import * as core from './cafe-core.js';
import { LANGS, NUMS, THANKS, itemById } from './cafe-data.js';
import { SCENES, PACES } from './lingo-scenes.js';
import { avatar, backdrop } from './lingo-art.js';
import { h, haptic, fill } from '../ui.js';
import { createLoop } from '../loop.js';
import { gameTop, hud, overlay } from './common.js';
import { runLesson } from './cafe-lesson.js';
import { itemArt } from './item-art.js';
import { scheduleReview, reviewOrder } from '../reviews.js';
import { restore, saveRun } from '../checkpoint.js';
import { speakLocal, stopSpeech } from '../speech.js';
import { sentence, englishLine } from './cafe-data.js';

export function mount(root, ctx) {
  const store = ctx.store;
  function validShift(g) { return LANGS.some(l=>l.id===g.lang) && SCENES.some(sc=>sc.id===g.scene) && typeof g.rnd==='function' && g.pace && PACES.some(p=>p.id===g.pace.id) && Array.isArray(g.tray) && g.tray.length<=12 && g.tray.every(id=>itemById(id)) && Array.isArray(g.slots) && g.slots.length===4 && g.slots.every(c=>!c||(['waiting','served','left'].includes(c.state)&&Number.isInteger(c.slot)&&c.slot>=0&&c.slot<4&&Array.isArray(c.order)&&c.order.length<=4&&c.order.every(o=>itemById(o.id)&&Number.isInteger(o.qty)&&o.qty>0&&o.qty<=3)&&Array.isArray(c.plate)&&c.plate.length<=12&&c.plate.every(id=>itemById(id)))) && g.box && g.stats && g.hearts>0 && g.hearts<=5 && Number.isInteger(g.shift) && g.shift>=1; }
  let langIdx = Math.round(store.pref('cafe', 'lang', 0));
  if (langIdx < 0 || langIdx >= LANGS.length) langIdx = 0;
  const prefIdx = (key, n, def) => {
    const v = Math.round(store.pref('cafe', key, def));
    return v >= 0 && v < n ? v : def;
  };
  let sceneIdx = prefIdx('scene', SCENES.length, 0);
  let paceIdx = ctx.practice ? 3 : prefIdx('pace', PACES.length, 1);
  const old = ctx.resume ? restore(store.loadGame('cafe'), validShift) : null;
  if (old) {langIdx=LANGS.findIndex(l=>l.id===old.state.lang);sceneIdx=SCENES.findIndex(sc=>sc.id===old.state.scene);paceIdx=PACES.findIndex(p=>p.id===old.state.pace.id);}
  const save = () => { if (s) saveRun(store,'cafe',s,{lang:langIdx,scene:sceneIdx,pace:paceIdx,mode:ctx.mode}); };
  let s = null; // the shift in progress
  let state = 'ready'; // ready | play | paused | over
  let pauseOv = null;
  let correction = null; // { slot, until, text, en, order }
  let floatNote = null;
  let thanks = {}; // slot -> phrase shown on a happy customer

  const score = hud('Score');
  const served = hud('Served', '0');
  const top = gameTop({ title: 'Lingo Café', onMenu: () => openPause(), right: h('div', { class: 'hud-row' }, score.el, served.el) });
  const hearts = h('div', { class: 'cf-hearts', role: 'img', 'aria-label': 'Reputation' });
  const rush = h('span', { class: 'cf-rush' });
  const combo = h('span', { class: 'cf-combo' });
  const status = h('div', { class: 'cf-status' }, hearts, rush, combo);
  const floor = h('div', { class: 'cf-floor' });
  const tray = h('div', { class: 'cf-tray', role: 'group', 'aria-label': 'Menu' });
  const trayLabel = h('div', { class: 'cf-traylabel' });
  const scenery = h('div', { class: 'cf-scenery' });
  const assistBtn = h('button', { class: 'cf-tool', type: 'button', 'aria-pressed': 'false', onclick: () => toggleAssist() }, 'Show words');
  const clearBtn = h('button', { class: 'cf-tool', type: 'button', onclick: () => doClear() }, 'Clear plate');
  const tools = h('div', { class: 'cf-tools' }, assistBtn, clearBtn);
  const el = h('div', { class: 'cf' }, top, scenery, status, floor, tools, trayLabel, tray);
  root.append(el);

  const lang = () => LANGS[langIdx];
  const skill = () => store.skill('cafe_' + lang().id);
  const scene = () => SCENES[sceneIdx];
  // the café keeps its original progress key so existing players continue where they were
  const shiftKey = () => 'shifts_' + lang().id + (scene().id === 'cafe' ? '' : '_' + scene().id);
  const shiftNo = () => 1 + Math.round(store.pref('cafe', shiftKey(), 0));
  const avatars = new Map(); // customer id -> drawn portrait, built once
  function dress() {
    el.dataset.scene = scene().id;
    el.style.setProperty('--sa', scene().look.a);
    el.style.setProperty('--sb', scene().look.b);
    fill(scenery, backdrop(scene().id));
    trayLabel.textContent = scene().look.tray;
    top.querySelector('.game-title').textContent = scene().id === 'cafe' ? 'Lingo Café' : `Lingo ${scene().name}`;
  }

  // ----- rendering -----
  const cardRefs = [];
  const cardEls = [];
  function renderHearts() {
    hearts.replaceChildren(...Array.from({ length: core.HEARTS }, (_, i) => h('span', { class: i < s.hearts ? 'on' : 'off' }, i < s.hearts ? '❤️' : '🖤')));
  }
  function showWord(id) {
    return s.assist || (s.box[id] ?? 0) < 2;
  }
  function renderTray() {
    tray.replaceChildren(
      ...s.tray.map((id) => {
        const x = itemById(id);
        return h(
          'button',
          { class: 'cf-item', type: 'button', 'aria-label': x[lang().id].noun, onpointerdown: (e) => (e.preventDefault(), tap(id)) },
          h('span', { class: 'cf-emoji' }, itemArt(id)),
          h('small', { class: showWord(id) ? '' : 'veil' }, showWord(id) ? x[lang().id].noun : '·'),
        );
      }),
    );
  }
  function renderFloor() {
    cardRefs.length = 0;
    cardEls.length = 0;
    for (const id of avatars.keys()) if (!s.slots.some((c) => c && c.id === id)) avatars.delete(id);
    const nodes = s.slots.map((c, i) => {
      const sel = i === s.selected && c && c.state === 'waiting';
      const label = scene().stations[lang().id][i];
      const labelEn = scene().stations.en[i];
      const tag = h('span', { class: 'cf-station' }, h('b', { lang: lang().id }, label), label !== labelEn ? h('small', null, labelEn) : null);
      if (!c) return h('div', { class: 'cf-card empty' }, tag);
      const fixing = correction && correction.slot === i && performance.now() < correction.until;
      const patience = h('i', { class: 'cf-pat' });
      cardRefs[i] = patience;
      const plate = h('div', { class: 'cf-plate' }, [...Array(c.qty)].map((_, k) => h('span', { class: 'cf-slot' + (c.plate[k] ? ' full' : '') }, c.plate[k] ? itemById(c.plate[k]).emoji : '')));
      let bubble;
      if (c.state === 'served') bubble = h('div', { class: 'cf-bubble happy' }, thanks[i] || '¡Gracias!');
      else if (c.state === 'left') bubble = h('div', { class: 'cf-bubble angry' }, '…');
      else if (fixing) bubble = h('div', { class: 'cf-bubble fix' }, h('strong', null, 'They wanted'), h('span', { class: 'cf-want' }, correction.order.map((o) => (o.qty > 1 ? o.qty + '×' : '') + itemById(o.id).emoji).join(' ')), h('small', null, correction.en));
      else bubble = h('div', { class: 'cf-bubble', lang: lang().id }, c.text);
      if (!avatars.has(c.id)) avatars.set(c.id, avatar(c.look ?? c.id, { vip: c.vip }));
      const card = h(
        'button',
        {
          class: 'cf-card' + (sel ? ' sel' : '') + (c.vip ? ' vip' : '') + (c.state !== 'waiting' ? ' ' + c.state : ''),
          type: 'button',
          'aria-label': `${labelEn}: ${c.text}`,
          onpointerdown: (e) => (e.preventDefault(), pickSlot(i)),
        },
        tag,
        h('span', { class: 'cf-face' }, avatars.get(c.id), c.vip ? h('b', { class: 'cf-crown' }, '⭐') : null),
        bubble,
        c.state === 'waiting' ? h('div', { class: 'cf-pat-wrap' }, patience) : null,
        c.state === 'waiting' ? plate : null,
      );
      cardEls[i] = card;
      return card;
    });
    floor.replaceChildren(...nodes);
    paintPatience();
  }
  function paintPatience() {
    s.slots.forEach((c, i) => {
      const b = cardRefs[i];
      if (!b || !c) return;
      const f = Math.max(0, c.patience / c.max);
      b.style.setProperty('width', (f * 100).toFixed(0) + '%');
      b.className = 'cf-pat ' + (f > 0.55 ? 'ok' : f > 0.25 ? 'mid' : 'low');
      if (cardEls[i]) cardEls[i].classList.toggle('low', f <= 0.3);
    });
  }
  function renderStatus() {
    score.set(core.scoreOf(s).toLocaleString());
    served.set(`${s.resolved}/${s.total}`);
    combo.textContent = s.combo >= 2 ? `Combo ×${s.combo}` : '';
  }

  // ----- actions -----
  function pickSlot(i) {
    if (state !== 'play') return;
    core.select(s, i);
    renderFloor();
  }
  function tap(id) {
    if (state !== 'play') return;
    const r = core.addToPlate(s, id);
    if (!r) return;
    ctx.audio.tick();
    handle();
    renderFloor();
    renderStatus();
  }
  function doClear() {
    if (state !== 'play') return;
    core.clearPlate(s);
    renderFloor();
  }
  function toggleAssist() {
    if (state !== 'play') return;
    s.assist = !s.assist;
    assistBtn.setAttribute('aria-pressed', s.assist ? 'true' : 'false');
    assistBtn.classList.toggle('on', s.assist);
    assistBtn.textContent = s.assist ? 'Words shown (no progress)' : 'Show words';
    renderTray();
  }
  function handle() {
    let changed = false;
    for (const e of s.events) {
      if (e.type === 'served') {
        const th = THANKS[lang().id];
        thanks[e.slot] = th[Math.floor(Math.random() * th.length)];
        ctx.audio.good();
        haptic(14);
        changed = true;
        say(`+${e.pts}${e.combo >= 2 ? '  combo ×' + e.combo : ''}`);
      } else if (e.type === 'wrong') {
        correction = { slot: e.slot, until: performance.now() + 3400, text: e.text, en: e.en, order: e.order };
        ctx.audio.bad();
        haptic(30);
        changed = true;
      } else if (e.type === 'left') {
        ctx.audio.beep(200, 240, 0.1, 'triangle');
        haptic([20, 40, 20]);
        renderHearts();
        changed = true;
      } else if (e.type === 'arrive') {
        ctx.audio.beep(740, 60, 0.05);
        changed = true;
        renderTray();
      } else if (e.type === 'rush') {
        rush.textContent = 'Rush hour!';
        setTimeout(() => (rush.textContent = ''), 3500);
      } else if (e.type === 'plate') changed = true;
    }
    s.events.length = 0;
    return changed;
  }
  let noteTimer = 0;
  function say(text) {
    floatNote = text;
    clearTimeout(noteTimer);
    rush.textContent = text;
    noteTimer = setTimeout(() => {
      if (floatNote === text) rush.textContent = '';
    }, 1500);
  }

  // ----- loop at 10 fps: DOM only, very light -----
  let lastFloorSig = '';
  let lastSaved = 0;
  function frame(dt) {
    if (state !== 'play') return;
    core.tick(s, dt);
    const changed = handle();
    if (correction && performance.now() > correction.until) {
      correction = null;
      renderFloor();
    }
    const sig = s.slots.map((c) => (c ? c.id + c.state : '-')).join('|') + s.selected;
    if (changed || sig !== lastFloorSig) {
      lastFloorSig = sig;
      renderFloor();
    } else paintPatience();
    renderStatus();
    if (s.t - (s._savedAt || 0) > 5) {s._savedAt=s.t;save();}
    if (s.over) end();
  }
  const loop = createLoop(frame, () => 10);

  function start(featured) {
    const sk = skill();
    s = old && state === 'ready' ? old.state : core.createShift({ lang: lang().id, box: sk.box, reviews: sk.reviews, shift: shiftNo(), seed: ctx.seed ?? ((Date.now() ^ 0x9e3779b1) & 0x7fffffff), featured, scene: scene().id, pace: PACES[paceIdx].id });
    avatars.clear();
    dress();
    correction = null;
    thanks = {};
    lastFloorSig = '';
    assistBtn.classList.remove('on');
    assistBtn.setAttribute('aria-pressed', 'false');
    assistBtn.textContent = 'Show words';
    state = 'play'; ctx.playing(true);
    renderHearts();
    renderTray();
    renderFloor();
    renderStatus();
    loop.start();
  }

  function end() {
    if (state === 'over') return;
    state = 'over'; ctx.playing(false);
    loop.stop();
    // save what was learned
    const sk = skill();
    sk.box = { ...s.box };
    sk.reviews ||= {};
    for (const [id, stats] of Object.entries(s.stats)) sk.reviews[id] = scheduleReview(sk.reviews[id], stats.miss===0 && stats.hit>0);
    store.clearGame('cafe');
    store.saveSkills();
    const done = s.reason === 'done';
    if (done) store.setPref('cafe', shiftKey(), shiftNo());
    const sum = core.summary(s);
    const tricky = sum.words.filter((w) => w.miss > 0).slice(0, 3);
    const ph = scene().phrases[lang().id];
    const phrase = ph[(shiftNo() - 1) % ph.length];
    const here = scene().items.filter((id) => (s.box[id] ?? -1) >= 3).length;
    const extra = [
      `${scene().name}, ${PACES[paceIdx].name.toLowerCase()} pace: ${done ? `shift ${shiftNo()} complete` : 'closed early'}`,
      `Served ${s.served} of ${s.total} ${scene().people}`,
      `${scene().name} words you know well: ${here} of ${scene().items.length}`,
      `Best streak: ×${s.bestCombo}`,
    ];
    if (tricky.length) extra.push('Practice: ' + tricky.map((w) => itemById(w.id).emoji + ' ' + itemById(w.id)[lang().id].noun).join(', '));
    extra.push(`Phrase to keep: ${phrase[0]} = ${phrase[1]}`);
    ctx.finish({ score: core.scoreOf(s), level: shiftNo(), accuracy: s.resolved ? s.served / s.resolved : null, completed: done, variant: `${s.lang}_${s.scene}_${s.pace.id}`, extra });
  }

  function openPause() {
    if (state !== 'play' || pauseOv) return;
    state = 'paused'; ctx.playing(false);
    save();
    loop.stop();
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('p', null, 'Customers wait while you pause.'),
      buttons: [
        { label: 'Save & leave', onclick: () => {save();ctx.exit();} },
        {
          label: 'Resume',
          kind: 'primary',
          onclick: () => {
            pauseOv = null;
            state = 'play'; ctx.playing(true);
            loop.start();
          },
        },
      ],
    });
  }

  // ----- ready screen: pick the language, then a short lesson, then the rush -----
  let lesson = null;
  let readyOv = null;
  function beginLesson(ids, teach) {
    state = 'lesson'; ctx.playing(false);
    lesson = runLesson({
      root: el,
      lang: lang(),
      ids,
      teach,
      shift: shiftNo(),
      scene: scene().id,
      ctx,
      onDone: (res) => {
        lesson = null;
        const sk = skill();
        // taught words start at box 1 (labels still shown); the ones you missed start at 0
        for (const id of ids) {
          if (teach) sk.box[id] = res.skipped ? 2 : res.missed.includes(id) ? 0 : 1;
          else sk.box[id] = Math.max(0, Math.min(core.MAX_BOX, (sk.box[id] ?? 0) + (res.missed.includes(id) ? -1 : 1)));
        }
        sk.reviews ||= {};
        for (const id of ids) sk.reviews[id]=scheduleReview(sk.reviews[id], !res.missed.includes(id));
        store.saveSkills();
        if (teach) start(ids);
        else {
          state = 'ready';
          showReady();
        }
      },
    });
  }
  function showReady() {
    dress();
    const body = h('div', { class: 'howto cf-ready' });
    function chips(list, cur, label, onPick, cls = '') {
      return h(
        'div',
        { class: 'theme-chips ' + cls, role: 'radiogroup', 'aria-label': label },
        list.map((x, i) =>
          h(
            'button',
            { class: 'theme-chip' + (i === cur ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': i === cur ? 'true' : 'false', onclick: () => onPick(i) },
            x.icon ? h('span', null, x.icon) : null,
            h('small', null, x.name),
          ),
        ),
      );
    }
    function paint() {
      dress();
      const l = lang();
      const sc = scene();
      const sk = skill();
      const n = shiftNo();
      const fresh = core.planNew(sk.box, n, sc.id);
      const knownHere = sc.items.filter((id) => id in sk.box).length;
      fill(
        body,
        h('p', null, 'Pick a place to work. Each round has two parts: learn a few words, then use them as people ask you for things.'),
        h(
          'div',
          { class: 'sc-grid', role: 'radiogroup', 'aria-label': 'Scenario' },
          SCENES.map((x, i) => {
            const known = x.items.filter((id) => id in sk.box).length;
            return h(
              'button',
              {
                class: 'sc-card' + (i === sceneIdx ? ' on' : ''),
                type: 'button',
                role: 'radio',
                'aria-checked': i === sceneIdx ? 'true' : 'false',
                style: { '--sa': x.look.a, '--sb': x.look.b },
                onclick: () => {
                  sceneIdx = i;
                  store.setPref('cafe', 'scene', i);
                  paint();
                },
              },
              h('span', { class: 'sc-art' }, backdrop(x.id)),
              h('span', { class: 'sc-icon' }, x.look.icon),
              h('b', null, x.name),
              h('small', null, x.role),
              h('i', { class: 'sc-meter', 'aria-label': `${known} of ${x.items.length} words met` }, h('em', { style: { width: Math.round((known / x.items.length) * 100) + '%' } })),
            );
          }),
        ),
        h('p', { class: 'sc-blurb' }, sc.blurb),
        h('strong', { class: 'es-len-h' }, 'Language'),
        chips(LANGS.map((x) => ({ icon: x.flag, name: x.name })), langIdx, 'Language', (i) => {
          langIdx = i;
          store.setPref('cafe', 'lang', i);
          paint();
        }, 'three'),
        h('strong', { class: 'es-len-h' }, 'Pace'),
        chips(PACES, paceIdx, 'Pace', (i) => {
          paceIdx = i;
          store.setPref('cafe', 'pace', i);
          paint();
        }, 'three'),
        h('p', { class: 'theme-desc' }, PACES[paceIdx].text),
        h('p', { class: 'cf-shift' }, `${sc.name} in ${l.name}, round ${n}. You have met ${knownHere} of ${sc.items.length} words here.`),
        fresh.length
          ? h(
              'div',
              { class: 'cf-new' },
              h('strong', null, 'Step 1: learn these'),
              h('ul', null, fresh.map((id) => h('li', null, h('span', { class: 'cf-emoji sm' }, itemArt(id)), h('b', { lang: l.id }, itemById(id)[l.id].noun), h('small', null, itemById(id).en)))),
              h('strong', { class: 'cf-step2' }, `Step 2: help the ${sc.people}`),
            )
          : h('p', null, `You have met every ${sc.name.toLowerCase()} word. Time to sharpen them.`),
        core.quantitiesOn(n) ? h('p', { class: 'cf-nums' }, `Numbers: ${NUMS[l.id][2]} = 2, ${NUMS[l.id][3]} = 3`) : null,
        knownHere >= 4 ? h('button', { class: 'btn cf-review', type: 'button', onclick: () => review() }, 'Quick review of words you have met here') : null,
        h('p', { class: 'fine' }, `${sc.items.filter(id=>id in skill().box && (skill().reviews?.[id]?.due||0)<=Date.now()).length} words due for review. Successful reviews return after 1, 3, 6, 13 days and longer; missed words return in 10 minutes.`),
        h('button', {class:'btn',type:'button',onclick:()=>conversation()}, 'Practice a conversation'),
      );
      startBtn.textContent = fresh.length ? 'Start lesson' : `Start the ${sc.people === 'customers' ? 'rush' : 'shift'}`;
    }
    function review() {
      const sk = skill();
      const weakest = reviewOrder(scene().items.filter(id=>id in sk.box), sk.box, sk.reviews).slice(0,6);
      readyOv.close();
      beginLesson(weakest, false);
    }
    readyOv = overlay(el, {
      title: 'Lingo',
      body,
      buttons: [
        {
          label: 'Start lesson',
          kind: 'primary',
          onclick: () => {
            const fresh = core.planNew(skill().box, shiftNo(), scene().id);
            if (fresh.length) beginLesson(fresh, true);
            else start(null);
          },
        },
      ],
    });
    const startBtn = readyOv.el.querySelector('.go-actions .btn');
    paint();
  }
  function conversation() {
    const l=lang().id, sc=scene(), ids=sc.items.slice(0,6);
    const target=ids[Math.floor(Math.random()*ids.length)], order=[{id:target,qty:1}];
    const line=sentence(l,order,0,sc.id);
    const answer=h('p',{class:'fine'},'Read the request, then choose what the person needs.');
    const body=h('div',{class:'howto'},h('p',{lang:l},line),h('button',{class:'btn',type:'button',onclick:()=>{if(!ctx.store.settings().sound || !speakLocal(line,l))answer.textContent='No installed offline voice for this language. Read the request above or install a system voice.';}},'Listen with offline voice'),h('div',{class:'theme-chips'},ids.map(id=>h('button',{class:'theme-chip',type:'button',onclick:e=>{const correct=id===target;answer.textContent=correct?`Correct. ${englishLine(order,0,sc.id)}`:'That is a different item. Read the request again.';e.currentTarget.classList.toggle('on',correct);if(correct){ctx.audio.good();const sk=skill();sk.reviews||={};sk.reviews[id]=scheduleReview(sk.reviews[id],true);store.saveSkills();}}},itemArt(id)))),answer);
    overlay(el,{title:'A short conversation',body,buttons:[{label:'Another request',onclick:conversation},{label:'Back',kind:'primary'}]});
  }
  if(old) overlay(el,{title:'Continue your shift',body:h('p',null,'Your customers and plate are just where you left them.'),buttons:[{label:'Continue',kind:'primary',onclick:()=>start(null)}]}); else showReady();

  return {
    destroy() {
      if (state==='play'||state==='paused') save();
      stopSpeech();
      if (lesson) lesson.destroy();
      loop.destroy();
      clearTimeout(noteTimer);
    },
    pause: openPause,
    onBack() {
      if (state === 'play') {
        openPause();
        return true;
      }
      if (state === 'paused' && pauseOv) return true;
      return false;
    },
  };
}

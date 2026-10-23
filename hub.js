import { h, icon, fill, modal } from './ui.js';
import { GAMES } from './registry.js';
import { store } from './store.js';
import { gameArt } from './art.js';
import { miniature, decorationArt } from './miniatures.js';
import { dailySeed, goalProgress } from './session.js';

export function mountHub(root,ctx){
 let view=['arcade','library','collection'][store.pref('arcade','view',0)]||'arcade',filter='All',mood='all';
 const sessions=store.sessions(),goal=goalProgress(store),total=sessions.length;
 const selected=store.pref('arcade','decor',0),style=store.pref('arcade','roomstyle',0);
 const el=h('div',{class:`screen arcade roomstyle-${style}`});
 const content=h('main',{class:'arcade-content',id:'main-content'});
 const navs=[];
 const mark=h('span',{class:'brand-mark'},icon('play',20));
 const header=h('header',{class:'arcade-header'},h('a',{class:'skip-link',href:'#main-content'},'Skip to games'),h('button',{class:'brand',type:'button',onclick:()=>setView('arcade')},mark,h('span',null,h('b',null,'NEURO ARCADE'),h('small',null,'A place to play.'))),h('nav',{'aria-label':'Main navigation'},[['arcade','The arcade'],['library','All games'],['collection','Your room']].map(([id,label])=>{const b=h('button',{class:'nav-link',type:'button',onclick:()=>setView(id)},label);navs.push([id,b]);return b;})),h('div',{class:'header-tools'},h('button',{class:'icon-btn',type:'button','aria-label':'Progress',onclick:()=>ctx.nav.go('stats')},icon('stats',20)),h('button',{class:'icon-btn',type:'button','aria-label':'Settings',onclick:()=>ctx.nav.go('settings')},icon('sliders',20))));
 el.append(header,content);root.append(el);
 function setView(v){view=v;store.setPref('arcade','view',['arcade','library','collection'].indexOf(v));render();content.scrollTop=0;}
 async function launch(g,mode='standard',resume=false){
  if(resume)return ctx.nav.go('game',{id:g.id,resume:true,mode:store.loadGame(g.id)?.meta?.mode||'standard'});
  const notes=h('div',{class:'launch-info'},h('p',null,g.blurb),h('p',{class:'fine'},`${g.duration} · ${g.category} · Saved automatically on this device`));
  const actions=g.id==='blockfit'?[{label:'Play Block Fit',value:'standard',kind:'primary'}]:[{label:'Take it easy',value:'practice'},{label:mode==='daily'?'Play daily challenge':'Let’s play',value:mode,kind:'primary'}];
  const chosen=await modal({title:g.name,body:notes,actions});
  if(chosen)ctx.nav.go('game',{id:g.id,mode:chosen,seed:chosen==='daily'?dailySeed(g.id):undefined});
 }
 function card(g){
  const history=sessions.filter(s=>s.g===g.id),save=store.loadGame(g.id),isNew=['signal','workshop','casebook','echo','logistics'].includes(g.id);
  const picture=['cafe','dungeon','survivor','estate'].includes(g.id)?h('img',{src:`assets/${g.world}.webp`,alt:'',loading:'lazy',decoding:'async'}):g.id==='blockfit'?gameArt(g):miniature(g);
  return h('article',{class:'game-card',style:{'--game':g.accent}},h('button',{class:'game-cover',type:'button','aria-label':`Play ${g.name}`,onclick:()=>launch(g)},picture,h('span',{class:'cover-category'},g.category),isNew?h('span',{class:'new-tag'},'NEW'):null,h('span',{class:'cover-play'},icon('play',22))),h('div',{class:'game-card-body'},h('div',{class:'card-title-row'},h('h3',null,g.name),h('span',null,g.duration)),h('p',null,g.tag),h('div',{class:'card-footer'},h('small',null,history.length?`${history.length} sessions · best ${Math.max(...history.map(s=>s.s)).toLocaleString()}`:'Your next little adventure'),h('button',{class:'text-btn',type:'button',onclick:()=>launch(g,'standard',!!save)},save?'Continue →':'Play →'))));
 }
 function section(title,subtitle,items){return h('section',{class:'arcade-section'},h('div',{class:'section-heading'},h('div',null,h('h2',null,title),h('p',null,subtitle))),h('div',{class:'game-grid'},items.map(card)));}
 function render(){
  navs.forEach(([id,b])=>{b.classList.toggle('active',id===view);b.setAttribute('aria-current',id===view?'page':'false');});
  if(view==='collection')return renderCollection();
  const filtered=GAMES.filter(g=>(filter==='All'||g.category===filter)&&(mood==='all'||mood==='short'&&g.minutes<=5||mood==='calm'&&g.category!=='Action'||mood==='adventure'&&g.category==='Adventure'));
  const filters=h('div',{class:'library-filters',role:'group','aria-label':'Filter games'},['All','Puzzle','Strategy','Adventure','Memory','Learn','Action'].map(category=>h('button',{class:'filter-chip'+(filter===category?' active':''),type:'button','aria-pressed':String(filter===category),onclick:()=>{filter=category;render();}},category)));
  const dailyGames=GAMES.filter(g=>g.id!=='blockfit'),daily=dailyGames[dailySeed('featured')%dailyGames.length];
  const saved=GAMES.filter(g=>store.loadGame(g.id));
  const hero=h('section',{class:'arcade-hero'},h('img',{class:'hero-room',src:'assets/arcade-room.webp',alt:'A warm miniature arcade with illuminated cabinets and plants'}),h('div',{class:'hero-scrim'}),h('div',{class:'hero-copy'},h('span',{class:'eyebrow'},'YOUR OFFLINE PLAY SPACE'),h('h1',null,'A little curiosity.',h('br'),h('em',null,'A lot to discover.')),h('p',null,'Ten small worlds for your next spare moment. Find a puzzle, learn a phrase, or head somewhere new.'),h('button',{class:'btn primary',type:'button',onclick:()=>{view='library';filter='All';render();content.scrollTop=0;}},'Explore the games',icon('right',17))),h('span',{class:'room-plaque'},total>=3?'A room that grows with you':'Make yourself at home'),store.pref('arcade','decor',0)>0?h('div',{class:'hero-decoration'},decorationArt(store.pref('arcade','decor',0))):null);
  const progress=h('div',{class:'week-goal'},h('div',null,h('span',{class:'eyebrow'},'YOUR WEEK, YOUR PACE'),h('h3',null,goal.complete?'Your weekly goal is complete':`${Math.min(goal.count,goal.goal)} of ${goal.goal} sessions`),h('p',null,'Any games you enjoy. Change your goal in Settings.')),h('div',{class:'goal-dots','aria-label':`${goal.count} of ${goal.goal} sessions`},Array.from({length:goal.goal},(_,i)=>h('i',{class:i<goal.count?'done':''}))),h('button',{class:'text-btn',type:'button',onclick:()=>ctx.nav.go('stats')},'View progress →'));
  const dailyCard=h('div',{class:'daily-card'},h('span',{class:'eyebrow'},'A FRESH CHALLENGE'),h('h3',null,daily.name),h('p',null,'The same starting challenge all day. Beat your own score, at your own pace.'),h('button',{class:'text-btn',type:'button',onclick:()=>launch(daily,'daily')},'Play today’s challenge →'));
  const moodPicker=h('div',{class:'mood-picker',role:'group','aria-label':'Choose your session'},[['all','Anything goes'],['short','I have five minutes'],['calm','Something relaxed'],['adventure','An adventure']].map(([id,label])=>h('button',{class:'filter-chip'+(mood===id?' active':''),type:'button','aria-pressed':String(mood===id),onclick:()=>{mood=id;render();}},label)));
  fill(content,view==='arcade'?hero:h('div',{class:'library-title'},h('span',{class:'eyebrow'},'THE COLLECTION'),h('h1',null,'Find your next favorite.'),h('p',null,'Ten games. No accounts, no ads. Everything works offline after installation.')),view==='arcade'?h('div',{class:'arcade-dashboard'},progress,dailyCard):null,saved.length&&view==='arcade'?section('Pick up where you left off','Your saved games are waiting.',saved):null,h('section',{class:'arcade-section'},h('div',{class:'section-heading'},h('div',null,h('h2',null,view==='arcade'?'What are you in the mood for?':'All games'),h('p',null,'Follow your curiosity. Everything is open from the start.'))),moodPicker,filters,h('div',{class:'game-grid'},filtered.map(card)),!filtered.length?h('p',{class:'empty'},'Try another category or session length.'):null),h('footer',{class:'arcade-footer'},h('span',null,'Made for small moments of play.'),h('button',{class:'text-btn',type:'button',onclick:()=>ctx.nav.go('checkin')},'Optional check-in →')));
 }
 function renderCollection(){
  const decor=[['A quiet corner','Your room starts here.',0],['A little greenery','Plants beside the cabinets.',3],['Warm evenings','A brass lamp for the room.',8],['The listening corner','A collection of favorite records.',15],['Under the stars','A tiny constellation above the arcade.',30]];
  const pick=store.pref('arcade','decor',0);
  fill(content,h('div',{class:'library-title'},h('span',{class:'eyebrow'},'YOUR LITTLE CORNER'),h('h1',null,'Make room for play.'),h('p',null,`${total} sessions played. Decorations unlock through play; every game stays available.`)),h('div',{class:`collection-room decor-${pick}`},h('img',{src:'assets/arcade-room.webp',alt:'Your miniature arcade room'}),h('div',{class:'room-decoration','aria-label':decor[pick]?.[0]||decor[0][0]},decorationArt(pick)),h('div',{class:'collection-plaque'},decor[pick]?.[0]||decor[0][0])),h('div',{class:'collection-grid'},decor.map(([title,desc,needed],i)=>h('button',{class:'decoration-card'+(pick===i?' selected':''),type:'button',disabled:total<needed?true:null,'aria-pressed':String(pick===i),onclick:()=>{store.setPref('arcade','decor',i);renderCollection();}},h('span',{class:'decor-symbol'},['⌂','❧','◈','♫','✧'][i]),h('b',null,title),h('small',null,total>=needed?desc:`Unlocks at ${needed} sessions`)))),h('section',{class:'arcade-section'},h('h2',null,'Set the mood'),h('div',{class:'library-filters'},['Blue hour','Warm amber','Garden green'].map((name,i)=>h('button',{class:'filter-chip'+(store.pref('arcade','roomstyle',0)===i?' active':''),type:'button',onclick:()=>{store.setPref('arcade','roomstyle',i);el.className=`screen arcade roomstyle-${i}`;renderCollection();}},name)))));
 }
 render();return{destroy(){}};
}

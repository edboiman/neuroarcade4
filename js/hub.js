import {h,icon,fill} from './ui.js';
import {GAMES} from './registry.js';
import {store} from './store.js';
import {gameArt} from './art.js';
import {miniature} from './miniatures.js';
import {dailySeed} from './session.js';
export function mountHub(root,ctx){
 let filter='All';const sessions=store.sessions(),order=['marbleworks','survivor','conquest','workshop','echo','blockfit','dungeon','estate','cafe','signal','casebook','logistics'];
 const games=[...GAMES].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 const content=h('main',{class:'arcade-content',id:'main-content'}),el=h('div',{class:'screen arcade'});
 el.append(h('header',{class:'arcade-header'},h('a',{class:'skip-link',href:'#main-content'},'Skip to games'),h('button',{class:'brand',type:'button',onclick:()=>{filter='All';render();}},h('span',{class:'brand-mark'},icon('play',20)),h('span',null,h('b',null,'NEURO ARCADE'),h('small',null,'Pick a world. Get playing.'))),h('nav',{'aria-label':'Main navigation'},h('button',{class:'nav-link active','aria-current':'page',onclick:()=>{filter='All';render();}},`Games (${GAMES.length})`),h('button',{class:'nav-link',onclick:()=>ctx.nav.go('stats')},'Progress')),h('div',{class:'header-tools'},h('button',{class:'icon-btn','aria-label':'Settings',onclick:()=>ctx.nav.go('settings')},icon('sliders',20)))),content);root.append(el);
 function launch(g,resume=false,mode='standard'){const saved=resume?store.loadGame(g.id):null;ctx.nav.go('game',{id:g.id,resume,mode:saved?.meta?.mode||mode,seed:mode==='daily'?dailySeed(g.id):undefined});}
 function card(g){const history=sessions.filter(s=>s.g===g.id),save=store.loadGame(g.id),fresh=['marbleworks','conquest'].includes(g.id);let picture;
 if(g.id==='survivor')picture=h('div',{class:'horde-cover'},h('div',{class:'horde-cover-floor'}),h('div',{class:'cover-ghoul'}),h('div',{class:'cover-ranger'}),h('div',{class:'cover-ogre'}));
 else picture=['cafe','dungeon','estate'].includes(g.id)?h('img',{src:`assets/${g.world}.webp`,alt:'',loading:'lazy',decoding:'async'}):g.id==='blockfit'?gameArt(g):miniature(g);
 return h('article',{class:'game-card',style:{'--game':g.accent}},h('button',{class:'game-cover','aria-label':`Play ${g.name}`,onclick:()=>launch(g)},picture,h('span',{class:'cover-category'},g.category),fresh?h('span',{class:'new-tag'},'NEW'):g.id==='survivor'?h('span',{class:'new-tag'},'REBUILT'):null,h('span',{class:'cover-play'},icon('play',22))),h('div',{class:'game-card-body'},h('div',{class:'card-title-row'},h('h3',null,g.name),h('span',null,g.duration)),h('p',null,g.tag),h('div',{class:'card-footer'},h('small',null,save?'Saved game ready':history.length?`${history.length} sessions`:'Ready when you are'),h('button',{class:'text-btn',onclick:()=>launch(g,!!save)},save?'Continue →':'Play →'))));}
 function render(){fill(content,h('section',{class:'arcade-intro'},h('div',null,h('span',{class:'eyebrow'},'THE NEXT CHAPTER'),h('h1',null,'Build. Conquer. Survive.'),h('p',null,'A marble atelier, a world to claim, and a horde that keeps coming. Twelve games, all open from the start.')),h('div',{class:'intro-note'},h('b',null,'No accounts. No ads.'),h('span',null,'Play offline after installation.'))),h('section',{class:'arcade-section'},h('div',{class:'library-filters',role:'group','aria-label':'Filter games'},['All','Puzzle','Action','Strategy','Adventure','Memory','Learn'].map(k=>h('button',{class:'filter-chip'+(filter===k?' active':''),'aria-pressed':String(filter===k),onclick:()=>{filter=k;render();}},k))),h('div',{class:'game-grid'},games.filter(g=>filter==='All'||g.category===filter).map(card))),h('footer',{class:'arcade-footer'},h('span',null,`${GAMES.length} games · Neuro Arcade 2.1`),h('span',null,'Your saves and progress stay on this device.')));}
 render();return{destroy(){}};
}

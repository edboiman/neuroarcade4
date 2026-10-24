// Original Cinderpath content. Effect numbers and card text share one source.
const e=(kind,value,plus=value)=>({kind,value,plus});
const card=(id,name,cost,type,target,path,rarity,effects,extra={})=>({id,name,cost,type,target,path,rarity,effects,...extra});
export const CARDS=[
 card('strike','Lantern Strike',1,'Attack','enemy','momentum',0,[e('damage',6,9)]),
 card('brace','Brace',1,'Skill','self','bastion',0,[e('block',7,10)]),
 card('kindle','Searing Mark',1,'Attack','enemy','ember',1,[e('damage',3,5),e('ember',3,5)]),
 card('dart','Cinder Dart',0,'Attack','enemy','ember',1,[e('damage',3,5),e('ember',1,2)]),
 card('backdraft','Backdraft',0,'Attack','enemy','ember',1,[e('emberDamage',1,2),e('draw',1)]),
 card('flashover','Flashover',2,'Attack','all','ember',2,[e('damage',8,12),e('ember',2,3)]),
 card('kiln','Kilnheart',2,'Power','self','ember',2,[e('kiln',3,5)]),
 card('detonate','Detonate',1,'Attack','enemy','ember',2,[e('detonate',3,4)]),
 card('wildfire','Wildfire',1,'Skill','all','ember',1,[e('ember',3,5)]),
 card('stoke','Stoke the Coals',1,'Skill','enemy','ember',2,[e('stoke',2,4)]),
 card('bastion','Bastion',2,'Skill','self','bastion',1,[e('block',17,24)]),
 card('hold','Hold the Line',1,'Skill','self','bastion',1,[e('block',7,11),e('retain',1)]),
 card('shieldbash','Shield Bash',1,'Attack','enemy','bastion',2,[e('blockDamage',1,2)]),
 card('riposte','Brass Riposte',1,'Power','self','bastion',2,[e('thorns',3,5)]),
 card('mend','Mending Light',2,'Skill','self','bastion',3,[e('heal',7,11)],{exhaust:true}),
 card('purge','Clear Mind',0,'Skill','self','bastion',1,[e('cleanse',1),e('block',3,6)],{exhaust:true}),
 card('quickstep','Quickstep',0,'Skill','self','momentum',1,[e('block',3,5),e('draw',1)]),
 card('spark','Borrowed Spark',0,'Skill','self','momentum',2,[e('energy',1,2)],{exhaust:true}),
 card('foresight','Foresight',1,'Skill','self','momentum',1,[e('draw',3,4)]),
 card('flurry','Lantern Flurry',1,'Attack','enemy','momentum',1,[e('damage',3,4),e('damage',3,4),e('damage',3,4)]),
 card('hammer','Bell Hammer',2,'Attack','enemy','momentum',1,[e('damage',18,25)]),
 card('expose','Find the Fracture',1,'Attack','enemy','momentum',1,[e('damage',5,8),e('vulnerable',2,3)]),
 card('chill','Quiet the Flame',1,'Skill','enemy','bastion',1,[e('weak',2,3),e('block',5,8)]),
 card('battlecry','Lantern Oath',1,'Skill','self','momentum',2,[e('strength',2,3)],{exhaust:true}),
 card('siphon','Warmth Returned',1,'Attack','enemy','ember',2,[e('damage',7,10),e('heal',2,4)],{exhaust:true}),
 card('nova','Daybreak',3,'Attack','all','ember',3,[e('damage',22,32)],{exhaust:true}),
 card('afterglow','Afterglow',2,'Power','self','ember',3,[e('afterglow',2,3)]),
 card('flow','Measured Breath',1,'Power','self','momentum',2,[e('flow',1,2)]),
 card('secondwind','Second Wind',1,'Skill','self','bastion',1,[e('block',8,11),e('draw',1,2)]),
 card('fervor','Burn Bright',0,'Skill','self','momentum',1,[e('loseHp',2),e('draw',2,3)]),
];
export const CARD=Object.fromEntries(CARDS.map(c=>[c.id,c]));
export const RELICS=[
 {id:'coal',name:'Coal Charm',icon:'✦',text:'Your first attack each battle deals 3 extra damage per hit.'},
 {id:'glass',name:'Glass Wick',icon:'♧',text:'Start each battle with 1 extra energy.'},
 {id:'moss',name:'Iron Moss',icon:'▨',text:'Start each battle with 8 block.'},
 {id:'kit',name:'Field Kit',icon:'✚',text:'Heal 3 health after every battle.'},
 {id:'lens',name:'Brass Lens',icon:'◈',text:'Draw an extra card on the first turn of each battle.'},
 {id:'ash',name:'Ashstone',icon:'◆',text:'Apply 1 extra Ember whenever a card or power applies Ember.'},
 {id:'coin',name:'Copper Sun',icon:'☀',text:'Earn 25% more gold from battles.'},
 {id:'heart',name:'Heartseed',icon:'❧',text:'Gain 10 maximum health and heal 10 when acquired.'},
 {id:'crown',name:'Cinder Crown',icon:'♛',text:'Start each battle with 1 Strength.'},
 {id:'ward',name:'Ward Seal',icon:'⬡',text:'Keep up to 5 block between turns.'},
 {id:'silk',name:'Woven Dawn',icon:'≋',text:'Gain 3 block at the start of every turn.'},
 {id:'seed',name:'Dawnseed',icon:'❋',text:'Once per expedition, a lethal blow restores 30 health instead.'},
];
export const RELIC=Object.fromEntries(RELICS.map(r=>[r.id,r]));
const attack=(damage,hits=1,extra={})=>({damage,hits,...extra});
export const ENEMIES={
 mite:{name:'Ash Mite',sprite:1,hp:24,pattern:[attack(5),attack(3,2),attack(4,1,{block:5})]},
 hound:{name:'Cinder Hound',sprite:2,hp:31,pattern:[attack(7),attack(0,0,{strength:2}),attack(4,2)]},
 wisp:{name:'Lantern Wisp',sprite:3,hp:25,pattern:[attack(4,1,{weak:1}),attack(3,1,{block:6}),attack(9)]},
 sentinel:{name:'Brass Sentinel',sprite:4,hp:38,pattern:[attack(6,1,{block:8}),attack(11),attack(0,0,{strength:2})]},
 cultist:{name:'Thorn Cantor',sprite:5,hp:33,pattern:[attack(6,1,{weak:1}),attack(0,0,{block:10}),attack(4,3)]},
 knight:{name:'Moss Knight',sprite:6,hp:43,pattern:[attack(7,1,{block:9}),attack(13)]},
 abbot:{name:'Iron Abbot',sprite:7,hp:68,pattern:[attack(8,1,{block:10}),attack(0,0,{strength:2}),attack(5,3)]},
 stalker:{name:'Glass Stalker',sprite:8,hp:58,pattern:[attack(4,3),attack(8,1,{weak:1}),attack(0,0,{strength:2})]},
 bell:{name:'The Bellkeeper',sprite:9,hp:88,boss:true,pattern:[attack(8,1,{block:6}),attack(0,0,{strength:2}),attack(4,3),attack(12,1,{weak:1})]},
 root:{name:'The Root Regent',sprite:10,hp:125,boss:true,pattern:[attack(9,1,{block:10}),attack(6,1,{heal:7}),attack(5,3),attack(0,0,{strength:2})]},
 flame:{name:'The Crownless Flame',sprite:11,hp:170,boss:true,pattern:[attack(5,3),attack(10,1,{block:12}),attack(15,1,{weak:1}),attack(0,0,{strength:3})]},
};
export const AREAS=[
 {name:'The Ember Cloister',short:'Ember Cloister',tag:'Keep the last light burning.',boss:'bell',color:'#e3ae73',rgb:'227,174,115',enemies:['mite','hound','wisp']},
 {name:'The Verdant Foundry',short:'Verdant Foundry',tag:'Something grows inside the iron.',boss:'root',color:'#9ecb98',rgb:'158,203,152',enemies:['sentinel','cultist','knight']},
 {name:'The Starless Choir',short:'Starless Choir',tag:'Carry dawn into the dark.',boss:'flame',color:'#bda7e6',rgb:'189,167,230',enemies:['knight','stalker','cultist']},
];
export const NODE_TYPES={battle:{name:'Battle',icon:'⚔'},elite:{name:'Elite',icon:'♜'},boss:{name:'Guardian',icon:'♛'},camp:{name:'Campfire',icon:'♨'},shop:{name:'Merchant',icon:'⚖'},event:{name:'Encounter',icon:'✧'}};
export function effects(c){const d=CARD[c.id];return d.effects.map(e=>({kind:e.kind,value:c.plus?e.plus:e.value}));}
export function cardName(c){return CARD[c.id].name+(c.plus?' +':'');}
export function cardText(c){const d=CARD[c.id],all=d.target==='all'?' to all enemies':'',phrases=effects(c).map(({kind,value:n})=>({
 damage:`Deal ${n} damage${all}.`,block:`Gain ${n} block.`,ember:`Apply ${n} Ember${all}.`,draw:`Draw ${n}.`,energy:`Gain ${n} energy.`,heal:`Heal ${n} health.`,loseHp:`Lose ${n} health.`,weak:`Apply ${n} Weak.`,vulnerable:`Apply ${n} Vulnerable.`,strength:`Gain ${n} Strength this battle.`,retain:'Keep your remaining block next turn.',emberDamage:`Deal ${n} damage per Ember on the target.`,detonate:`Remove the target’s Ember; deal ${n} damage per stack.`,stoke:`Double the target’s Ember, then add ${n}.`,blockDamage:`Deal damage equal to ${n===1?'your block':n+' × your block'}.`,kiln:`Whenever you apply Ember, gain ${n} block.`,thorns:`When an attack hits your block, return ${n} damage.`,afterglow:`At turn start, apply ${n} Ember to every enemy.`,flow:`Every third card you play each turn draws ${n}.`,cleanse:'Remove your Weak.'
 }[kind]));return phrases.join(' ')+(d.exhaust?' Exhaust.':'')+(d.type==='Power'?' Stays in play this battle.':'');}

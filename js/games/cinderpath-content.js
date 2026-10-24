// Original solo expansion informed by genre systems, with independent content/balance.
const e=(kind,value,plus=value)=>({kind,value,plus});
const card=(id,name,cost,type,target,path,rarity,effects,extra={})=>({id,name,cost,type,target,path,rarity,effects,...extra});
const L=(...args)=>({...card(...args),hero:'lantern'}),I=(...args)=>({...card(...args),hero:'ironbound'}),S=(...args)=>({...card(...args),hero:'starweaver'});
export const HEROES=[
 {id:'lantern',name:'Lanternbearer',title:'Ember & sacrifice',hp:80,relic:'coal',signature:'kindle',sprite:0,description:'Stack Ember, turn heat into protection, and burn through enemy defenses.'},
 {id:'ironbound',name:'Ironbound',title:'Forge & fortification',hp:90,relic:'anvil',signature:'temper',sprite:12,description:'Build Forge with defensive cards, then spend it on crushing blows or immense block.'},
 {id:'starweaver',name:'Starweaver',title:'Glimmer & foresight',hp:78,relic:'prism',signature:'starmark',sprite:13,description:'Generate Glimmer, spend it on celestial techniques, and shape your next draw.'},
];
export const EXTRA_CARDS=[
 L('charbolt','Charcoal Bolt',1,'Attack','enemy','ember',1,[e('damage',8,11),e('ember',2,3)]),
 L('emberglass','Emberglass',0,'Skill','enemy','ember',1,[e('ember',4,6),e('selfWeak',1)]),
 L('pyre','Funeral Pyre',1,'Skill','all','ember',2,[e('ember',5,8)],{exhaust:true}),
 L('coalfold','Coalfold',1,'Skill','self','ember',1,[e('block',6,9),e('emberAll',2,3)]),
 L('heatsink','Heat Sink',1,'Skill','self','ember',2,[e('burnBlock',1,2)]),
 L('cindersight','Cinder Sight',1,'Skill','self','ember',1,[e('scry',3,5)],{innate:true}),
 L('phoenix','Phoenix Script',2,'Skill','self','ember',3,[e('strength',3,4),e('heal',3,5)],{exhaust:true}),
 L('ashmemory','Ash Memory',1,'Skill','self','ember',2,[e('recover',1)],{exhaust:true}),
 L('emberrain','Ember Rain',0,'Attack','all','ember',3,[e('xDamage',4,6),e('xEmber',1,2)],{xCost:true}),
 L('vow','Blazing Vow',1,'Power','self','ember',2,[e('emberHit',1,2)]),
 I('temper','Temper',1,'Skill','self','bastion',1,[e('block',6,9),e('forge',2,3)]),
 I('rivets','Pocket Rivets',0,'Skill','self','bastion',1,[e('forge',3,5)],{exhaust:true}),
 I('hammerfall','Hammerfall',1,'Attack','enemy','bastion',2,[e('forgedDamage',5,7)]),
 I('quench','Quench',1,'Skill','self','bastion',1,[e('forgeBlock',4,6)]),
 I('towerguard','Tower Guard',1,'Skill','self','bastion',1,[e('block',10,14),e('forge',1,2)]),
 I('slatesting','Slate Sting',1,'Attack','enemy','bastion',1,[e('damage',7,10),e('forge',1,2)]),
 I('anvilchorus','Anvil Chorus',2,'Power','self','bastion',2,[e('forgeTurn',2,3)]),
 I('shieldwall','Shield Wall',2,'Skill','self','bastion',2,[e('block',19,26),e('retain',1)]),
 I('rallyplate','Rallying Plate',0,'Skill','self','bastion',1,[e('block',5,8)],{ethereal:true}),
 I('anchor','Anchor the Line',2,'Skill','enemy','bastion',2,[e('block',15,20),e('weak',2,3)]),
 I('rebuckle','Rebuckle',1,'Skill','self','bastion',2,[e('block',8,12),e('recover',1)]),
 I('steelwill','Steel Will',1,'Power','self','bastion',3,[e('dexterity',2,3)]),
 I('bulwark','Bulwark',0,'Skill','self','bastion',2,[e('xBlock',7,10)],{xCost:true}),
 I('ram','Gatebreaker',1,'Attack','enemy','bastion',1,[e('damage',10,14),e('forge',1,2)]),
 I('fortressoath','Fortress Oath',2,'Power','self','bastion',3,[e('thorns',3,5),e('block',10,15)]),
 S('starmark','Star Mark',1,'Attack','enemy','momentum',1,[e('damage',4,7),e('glimmer',2,3)]),
 S('stardust','Stardust',0,'Skill','self','momentum',1,[e('glimmer',2,3)],{ethereal:true}),
 S('lance','Astral Lance',1,'Attack','enemy','momentum',1,[e('damage',18,25)],{glimmerCost:2}),
 S('orbitguard','Orbit Guard',1,'Skill','self','momentum',1,[e('block',9,13),e('glimmer',1,2)]),
 S('constellation','Constellation',2,'Power','self','momentum',2,[e('glimmerTurn',2,3)]),
 S('comet','Cometfall',1,'Attack','all','momentum',2,[e('comet',4,6)],{needsGlimmer:true}),
 S('moondraw','Moonlit Study',1,'Skill','self','momentum',1,[e('draw',2,3),e('glimmer',1,2)]),
 S('satellite','Little Satellites',1,'Skill','self','momentum',1,[e('conjure',2,3)]),
 S('prismburst','Prism Burst',2,'Attack','all','momentum',2,[e('damage',12,17)],{glimmerCost:2}),
 S('eclipse','Eclipse',1,'Skill','enemy','momentum',1,[e('weak',2,3),e('glimmer',2,3)]),
 S('astralstep','Astral Step',0,'Skill','self','momentum',1,[e('block',4,7)],{retainCard:true}),
 S('voidchart','Chart the Void',1,'Skill','self','momentum',1,[e('scry',4,6)]),
 S('afterimage','Afterimage',2,'Power','self','momentum',3,[e('drawTurn',1,2)]),
 S('moonwell','Moonwell',1,'Skill','self','momentum',3,[e('glimmer',3,4),e('heal',3,5)],{exhaust:true}),
 S('gravity','Gentle Gravity',2,'Skill','all','momentum',2,[e('block',14,20),e('weak',1,2)],{glimmerCost:1}),
 S('lunarblade','Lunar Blade',0,'Attack','enemy','momentum',1,[e('damage',9,13)],{glimmerCost:1}),
 S('starforge','Starforge',1,'Skill','self','momentum',2,[e('glimmer',5,7)],{exhaust:true}),
 S('timestitch','Stitch the Moment',1,'Skill','self','momentum',2,[e('retainHand',1),e('draw',1,2)]),
 S('aetherweave','Aether Weave',1,'Skill','self','momentum',2,[e('improvise',1),e('glimmer',1,2)]),
 S('supernova','A Quiet Supernova',0,'Attack','all','momentum',3,[e('xDamage',7,10)],{xCost:true,glimmerCost:3}),
 S('northstar','The North Star',2,'Power','self','momentum',3,[e('starsEdge',1,2)]),
 card('daze','Daze',0,'Status','self','bastion',0,[],{unplayable:true,ethereal:true,temporary:true}),
 card('splinter','Splinter',0,'Status','self','bastion',0,[],{unplayable:true,temporary:true}),
 card('scorch','Scorch',0,'Status','self','ember',0,[],{unplayable:true,temporary:true,endDamage:2}),
 card('burden','Burden',0,'Curse','self','bastion',0,[],{unplayable:true}),
 card('regret','Regret',0,'Curse','self','ember',0,[],{unplayable:true,endDamage:1}),
 card('starbit','Starlight Shard',0,'Attack','enemy','momentum',0,[e('damage',4,6)],{exhaust:true,temporary:true}),
];
export const ENCHANTMENTS={
 keen:{name:'Keen',text:'Each damage effect deals 2 extra base damage.'},
 warded:{name:'Warded',text:'Gain 3 block after playing this card.'},
 kindled:{name:'Kindled',text:'After playing, apply 2 Ember to every living enemy.'},
 flowing:{name:'Flowing',text:'Draw 1 after playing this card.'},
 swift:{name:'Swift',text:'Costs 1 less energy, minimum 0.'},
};
export const POTIONS=[
 {id:'sparkflask',name:'Spark Flask',icon:'ϟ',target:'enemy',kind:'damage',value:20,text:'Deal 20 damage to one enemy. Ignores your Strength and Weak.'},
 {id:'wardflask',name:'Ward Flask',icon:'⬡',target:'self',kind:'block',value:18,text:'Gain 18 block.'},
 {id:'suntonic',name:'Sun Tonic',icon:'☀',target:'self',kind:'energy',value:2,text:'Gain 2 energy this turn.'},
 {id:'inkdraught',name:'Ink Draught',icon:'◈',target:'self',kind:'draw',value:3,text:'Draw 3 cards.'},
 {id:'lifedrop',name:'Lifedrop',icon:'✚',target:'self',kind:'heal',value:15,text:'Heal 15 health. Usable outside combat.'},
 {id:'emberoil',name:'Ember Oil',icon:'♨',target:'all',kind:'ember',value:8,text:'Apply 8 Ember to all living enemies.'},
 {id:'clearwater',name:'Clearwater',icon:'≈',target:'self',kind:'cleanse',value:1,text:'Remove Weak and all battle-only card afflictions.'},
 {id:'stardew',name:'Star Dew',icon:'✧',target:'self',kind:'resource',value:5,text:'Gain 5 of your hero’s resource. Lanternbearer gains 2 energy instead.'},
];
export const POTION=Object.fromEntries(POTIONS.map(p=>[p.id,p]));
export const EXTRA_RELICS=[
 {id:'anvil',name:'Traveler’s Anvil',icon:'▣',starter:true,text:'The first time you gain block each turn, gain 3 more block and 1 Forge.'},
 {id:'prism',name:'Sleeping Prism',icon:'✧',starter:true,text:'Start every battle with 3 Glimmer; gain 1 each turn after the first.'},
 {id:'pouch',name:'Apothecary Pouch',icon:'♧',text:'Carry one extra potion.'},
 {id:'spool',name:'Memory Spool',icon:'◎',text:'The first non-X card you play each battle costs no energy.'},
 {id:'vial',name:'Cinder Vial',icon:'♨',text:'Battle rewards are more likely to include a potion.'},
 {id:'boots',name:'Roadworn Boots',icon:'⌁',text:'Merchant prices are 15% lower.'},
 {id:'locket',name:'Stone Locket',icon:'▨',text:'Gain 2 block whenever you play an Attack.'},
 {id:'feather',name:'Ink Feather',icon:'❦',text:'Draw 1 whenever a card is exhausted.'},
 {id:'needle',name:'Moon Needle',hero:'starweaver',icon:'☽',text:'Draw 1 after playing a card that spends Glimmer.'},
 {id:'whetstone',name:'Patient Whetstone',icon:'◇',text:'When acquired, upgrade two random unupgraded Attacks.'},
 {id:'ring',name:'Thorn Ring',icon:'✥',text:'When an enemy hits your block, return 2 damage.'},
 {id:'shard',name:'Prism Shard',hero:'starweaver',icon:'◆',text:'Gain 1 Glimmer at the start of every turn.'},
 {id:'bellcharm',name:'Pocket Bell',icon:'♧',text:'Every third turn, gain 1 extra energy.'},
 {id:'redthread',name:'Red Thread',icon:'∞',text:'Reduce each incoming attack hit by 1 damage.'},
 {id:'furnace',name:'Furnace Pact',icon:'☀',rarity:'pact',text:'Gain 1 energy every turn, but draw 1 fewer card each turn.'},
 {id:'sundial',name:'Sealed Sundial',icon:'◷',rarity:'pact',text:'Gain 1 energy every turn. Carry only one potion; excess potions sell for 10 gold each.'},
 {id:'glasspact',name:'Glass Covenant',icon:'♜',rarity:'pact',text:'Gain 1 energy every turn, but campfires can no longer heal you.'},
 {id:'hollow',name:'Hollow Crown',icon:'♛',rarity:'pact',text:'Start battles with 3 Strength and 1 Weak.'},
 {id:'tribute',name:'Traveler’s Tribute',icon:'❧',rarity:'pact',text:'Gain 15 maximum health and heal 15 now. Merchant prices are 20% higher.'},
 {id:'burdenpact',name:'Endless Satchel',icon:'▱',rarity:'pact',text:'Draw 1 extra card each turn. Two temporary Burdens enter your draw pile each battle.'},
];
const a=(damage,hits=1,extra={})=>({damage,hits,...extra});
export const EXTRA_ENEMIES={
 cantor:{name:'The Ashen Cantor',sprite:14,hp:78,boss:true,wake:true,pattern:[a(5,2,{status:'scorch'}),a(0,0,{summon:'mite'}),a(13),a(0,0,{strength:3,afflict:'taxed'})]},
 briar:{name:'The Briar Heart',sprite:15,hp:105,boss:true,wake:true,armor:1,pattern:[a(9,1,{block:12}),a(6,2,{status:'splinter'}),a(0,0,{heal:9,strength:2}),a(16)]},
 archivist:{name:'The Night Archivist',sprite:16,hp:120,boss:true,wake:true,pattern:[a(10,1,{afflict:'brittle'}),a(6,3,{status:'daze'}),a(0,0,{summon:'sentry',block:12}),a(19,1,{weak:1})]},
 pilgrim:{name:'Bell Pilgrim',sprite:17,hp:30,pattern:[a(5,1,{afflict:'taxed'}),a(4,2),a(0,0,{block:8})]},
 scarab:{name:'Forge Scarab',sprite:18,hp:72,armor:2,pattern:[a(6,2),a(0,0,{block:14,strength:2}),a(11,1,{status:'splinter'})]},
 sentry:{name:'Crystal Sentry',sprite:19,hp:40,thorns:2,pattern:[a(7,1,{status:'daze'}),a(0,0,{block:10}),a(5,2)]},
};
export const ALTERNATE_AREAS=[
 {name:'The Ashen Belfry',short:'Ashen Belfry',tag:'The bells remember a different dawn.',boss:'cantor',color:'#e6ad8c',rgb:'230,173,140',enemies:['pilgrim','wisp','hound']},
 {name:'The Briar Engine',short:'Briar Engine',tag:'Roots turn the wheels of an abandoned world.',boss:'briar',color:'#a6cb80',rgb:'166,203,128',enemies:['scarab','cultist','knight']},
 {name:'The Inkbound Vault',short:'Inkbound Vault',tag:'Every lost future has a keeper.',boss:'archivist',color:'#b8a6ea',rgb:'184,166,234',enemies:['sentry','stalker','pilgrim']},
];
export const WAYKEEPERS=[
 {name:'Morrow, Keeper of Embers',text:'A patient flame offers a beginning. Its gifts ask what you are willing to carry.'},
 {name:'Verdigris, the Patient Smith',text:'The smith offers power with a lasting price. Read each pact before choosing.'},
 {name:'Nacre, Witness of Night',text:'The final witness offers one last bargain before the guardian.'},
];
export const CHALLENGES=['Standard expedition','I · Stronger foes','II · Sharper attacks','III · A burden to carry','IV · Costly provisions','V · Relentless guardians'];
export const GLOSSARY={Ember:'Damage before enemies act; bypasses block, then loses one stack.',Forge:'Ironbound resource. Store up to 12; spend it on Hammerfall or Quench.',Glimmer:'Starweaver resource. Store up to 12; blue-cost cards spend it in addition to energy.',Retain:'A retained card stays in hand at end of turn.',Ethereal:'Exhausts at turn end if it is still in your hand.',Exhaust:'Leaves this battle. Permanent deck cards return next battle.',Innate:'Drawn into the opening hand before normal cards.',Weak:'Attack damage is reduced by 25%.',Vulnerable:'Incoming attack damage is increased by 50%.',Enchantment:'An additional permanent modifier on a card for this expedition.',Affliction:'A harmful battle-only modifier. Taxed adds 1 energy to its next play; Brittle costs 2 health when played.',Scry:'Inspect upcoming cards, discard any you choose, then draw 1.',Curse:'A permanent drawback card. Some events and merchants can remove it.'};

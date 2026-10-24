import {s,h} from '../ui.js';
// Painted characters share an atlas; architecture is native and unique to each area.
export function actor(sprite,{small=false}={}){return h('span',{class:'cp-actor'+(small?' small':''),style:{'--sx':`${sprite%4*100/3}%`,'--sy':`${Math.floor(sprite/4)*50}%`},'aria-hidden':'true'});}
export function scene(act){
 const colors=[['#15212b','#6a4d3d','#e4ad6b'],['#112a2a','#3e5c49','#acd58f'],['#191c36','#514c70','#c8b4ec']][act];
 const a=s('svg',{viewBox:'0 0 1100 420',preserveAspectRatio:'xMidYMax slice','aria-hidden':'true',class:'cp-architecture'});
 a.append(s('path',{d:'M0 0H1100V420H0Z',fill:colors[0]}));
 for(let i=0;i<6;i++){const x=-30+i*230;
  a.append(s('path',{d:`M${x} 410V108Q${x+105} -30 ${x+210} 108V410H${x+181}V115Q${x+105} 11 ${x+29} 115V410Z`,fill:colors[1],opacity:.65}),s('path',{d:`M${x+36} 397V118Q${x+105} 28 ${x+174} 118V397`,fill:'none',stroke:colors[2],'stroke-width':2,opacity:.22}));
  if(act===0)a.append(s('path',{d:`M${x+105} 6V142 M${x+88} 147H${x+122}L${x+118} 182H${x+92}Z`,stroke:'#d4a56c','stroke-width':3,fill:'#dca75d'}),s('circle',{cx:x+105,cy:162,r:28,fill:'#e4ad6b',opacity:.08}));
  if(act===1){a.append(s('path',{d:`M${x+25} 420Q${x+120} 245 ${x+47} 91 M${x+175} 420Q${x+65} 287 ${x+176} 189`,fill:'none',stroke:'#557552','stroke-width':16}));for(let j=0;j<4;j++)a.append(s('ellipse',{cx:x+37+j*13,cy:132+j*38,rx:24,ry:8,fill:'#7b9a69',transform:`rotate(-32 ${x+37+j*13} ${132+j*38})`}));a.append(s('circle',{cx:x+108,cy:230,r:36,fill:'none',stroke:'#8c986d','stroke-width':9}),s('circle',{cx:x+108,cy:230,r:12,fill:'#d6d4a2'}));}
  if(act===2){a.append(s('path',{d:`M${x+40} 345L${x+91} 178L${x+132} 346 M${x+105} 6L${x+105} 85`,fill:'#3a3b62',stroke:'#8a80af','stroke-width':2}),s('path',{d:`M${x+90} 83L${x+105} 60L${x+120} 83L${x+105} 105Z`,fill:'#c4acf0',opacity:.65}));}
 }
 a.append(s('path',{d:'M0 371Q550 327 1100 371V420H0Z',fill:'#131b25'}),s('path',{d:'M0 371Q550 327 1100 371 M0 414H1100 M120 366L40 420 M350 350L315 420 M750 350L785 420 M980 366L1060 420',fill:'none',stroke:colors[2],'stroke-width':2,opacity:.2}));
 for(let i=0;i<24;i++)a.append(s('circle',{cx:(i*131+83)%1100,cy:(i*71+17)%310,r:i%3===0?2:1,fill:colors[2],opacity:.32}));return a;
}
const GLYPHS={
 strike:'M39 62L70 25L82 13L79 31L47 65 M36 48L55 65 M33 68L42 59',
 brace:'M60 13L85 23V44Q80 60 60 70Q40 60 35 44V23Z M60 26V55 M48 39H72',
 kindle:'M60 10Q85 35 78 53Q70 71 50 63Q35 51 49 31Q46 49 57 45Q65 36 60 10Z M27 18L35 25 M89 15L83 25',
 dart:'M29 60L85 20 M62 20H86V44 M33 35Q20 50 35 59Q48 65 53 51',
 backdraft:'M80 25Q44 6 29 39Q21 63 53 66Q83 68 87 43 M76 52L88 41L94 55 M59 26Q78 42 60 54Q43 46 59 26Z',
 flashover:'M29 63Q13 47 32 26Q30 46 40 45 M60 11Q83 37 69 62Q48 77 45 53Q44 39 60 11Z M80 61Q76 45 92 27Q88 44 101 53',
 kiln:'M32 45H88L78 68H42Z M39 52H81 M47 45Q37 31 53 19 M62 43Q53 23 68 10 M75 44Q69 31 83 24',
 detonate:'M60 9L67 31L89 19L78 40L104 46L78 51L88 72L66 60L60 78L53 59L31 70L42 50L17 44L43 38L33 18L54 30Z',
 wildfire:'M31 67Q10 44 36 21Q26 41 43 39 M60 12Q81 38 67 64Q52 76 43 57 M82 65Q73 42 95 23Q89 41 105 51',
 stoke:'M24 66L86 17 M75 15L92 18L84 31 M51 28L43 13 M61 54L73 64 M32 41L17 38 M80 43L96 39',
 bastion:'M30 67V25H40V14H51V25H68V14H79V25H90V67Z M51 67V48Q60 35 69 48V67 M23 68H98',
 hold:'M60 12L82 22V44Q76 60 60 68Q44 60 38 44V22Z M30 36H42 M77 36H91 M27 28V45 M94 28V45',
 shieldbash:'M58 12L81 23V44Q75 60 58 70Q40 60 35 44V23Z M77 43L96 34 M79 53L100 57 M72 64L86 76',
 riposte:'M30 65L80 13 M24 53L43 71 M89 65L40 13 M77 71L96 52 M35 14L46 24 M75 24L85 14',
 mend:'M45 27H76L72 64H49Z M52 27V13H68V27 M55 39H66 M60 34V51 M38 66H83',
 purge:'M60 41Q28 7 28 33Q26 51 60 41Q90 8 92 32Q94 52 60 41Q24 68 49 72Q67 70 60 41Q94 70 75 74Q57 78 60 41Z',
 quickstep:'M33 18Q26 40 41 45L50 58Q53 65 43 68L31 51Q14 30 33 18Z M76 10Q70 32 84 39L93 52Q96 61 85 62L74 46Q58 22 76 10Z',
 spark:'M67 8L35 44H57L49 73L89 32H65Z',
 foresight:'M18 41Q59 1 103 41Q59 79 18 41Z M60 24A17 17 0 1 0 60 58A17 17 0 1 0 60 24 M60 34V48 M53 41H67',
 flurry:'M23 65L48 20 M48 65L73 13 M73 65L98 20 M19 48L33 55 M44 48L58 55 M69 48L83 55',
 hammer:'M35 68L72 28 M59 17L73 9L96 31L87 43Z M29 61L42 72 M68 17L86 35',
 expose:'M60 7L92 25V58L60 75L28 58V25Z M60 10L48 31L68 39L52 52L60 73 M49 31L29 25 M68 39L91 26',
 chill:'M60 10V24 M44 25Q60 17 76 25L84 57H36Z M33 58H87 M53 65Q60 73 67 65',
 battlecry:'M36 71V12Q59 27 84 15V48Q61 60 36 43 M28 72H48 M41 17L43 43',
 siphon:'M32 23H88L77 51Q60 67 43 51Z M60 57V72 M46 73H74 M61 9Q77 26 61 39Q45 30 61 9Z',
 nova:'M60 19A22 22 0 1 0 60 63A22 22 0 1 0 60 19 M60 5V13 M60 68V77 M24 41H15 M96 41H106 M32 12L39 20 M83 62L91 70 M31 70L39 62 M83 20L91 12',
 afterglow:'M44 26H76L82 63H38Z M51 26V12H69V26 M32 64H88 M60 35L65 47L60 57L55 47Z M35 20L28 13 M86 20L93 13',
 flow:'M61 41Q31 8 22 33Q13 62 43 53L77 30Q107 14 101 44Q94 76 61 41Z',
 secondwind:'M31 62Q25 13 94 13Q93 61 42 62 M31 69L79 28 M47 53L43 33 M59 43L79 44',
 fervor:'M60 67Q20 46 27 26Q38 11 60 28Q79 9 92 25Q106 43 60 67Z M61 29L49 45H65L56 61',
};
export function motif(path,type='Skill',id=''){
 const a=s('svg',{viewBox:'0 0 120 80','aria-hidden':'true',class:'cp-card-motif'}),color={ember:'#efb276',bastion:'#9fc7bd',momentum:'#c4b6e7'}[path];
 a.append(s('circle',{cx:60,cy:40,r:29,fill:'none',stroke:color,'stroke-width':1,opacity:.4}));
 if(GLYPHS[id]){a.append(s('path',{d:GLYPHS[id],fill:'none',stroke:color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));return a;}
 if(path==='ember')a.append(s('path',{d:'M60 7Q87 32 80 52Q71 76 48 65Q29 54 45 31Q42 49 53 47Q67 40 60 7Z',fill:color}),s('path',{d:'M59 39Q76 58 61 65Q48 61 59 39Z',fill:'#fce9b6'}));
 else if(path==='bastion')a.append(s('path',{d:'M60 10L85 20V43Q81 60 60 71Q39 60 35 43V20Z',fill:'#2d5053',stroke:color,'stroke-width':3}),s('path',{d:'M60 22V56 M48 36H72',stroke:color,'stroke-width':3}));
 else a.append(s('path',{d:'M24 51Q47 17 78 34L70 23 M94 29Q74 66 41 50L48 63',fill:'none',stroke:color,'stroke-width':4,'stroke-linecap':'round'}));
 if(type==='Power')a.append(s('path',{d:'M9 39H24 M96 39H111 M60 0V8 M60 72V80',stroke:color,'stroke-width':2}));return a;
}

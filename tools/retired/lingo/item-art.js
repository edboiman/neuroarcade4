// Vocabulary pictures use one consistent native vector set, independent of emoji fonts.
import { s } from '../../../js/ui.js';
export function itemArt(id){
 const a=s('svg',{viewBox:'0 0 80 80','aria-hidden':'true',class:'item-art'});
 const path=(d,fill,stroke)=>s('path',{d,fill,stroke,'stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round'});
 const rect=(x,y,w,h,fill,rx=4)=>s('rect',{x,y,width:w,height:h,fill,rx});
 const circle=(cx,cy,r,fill)=>s('circle',{cx,cy,r,fill});
 const line=(d,stroke)=>path(d,'none',stroke);
 const add=(...x)=>a.append(...x);
 const gold='#d0a164',dark='#3f5650',cream='#f1e2bd',red='#c77d68',green='#86a97e',blue='#88b7c1';
 if(['coffee','tea','soup'].includes(id)){add(s('ellipse',{cx:39,cy:65,rx:30,ry:6,fill:'#b7bb9b'}),path('M13 28H61L55 58Q39 70 20 58Z',id==='tea'?'#a3b88d':cream),line('M60 34Q78 32 70 48Q65 54 58 48',gold),s('ellipse',{cx:37,cy:29,rx:24,ry:7,fill:id==='tea'?'#8eab71':id==='soup'?red:'#71513c'}),line('M29 18Q19 10 28 3 M45 18Q35 10 44 3','#b5c1ab'));}
 else if(['water','juice','milkshake','beer','cola','lemonade','glass','wine'].includes(id)){const c={water:blue,juice:'#d7a46b',milkshake:'#bd9685',beer:'#d4ab64',cola:'#755643',lemonade:'#d6ca7b',glass:'#bdcfc0',wine:'#a46970'}[id];if(id==='wine'){add(path('M22 13H58L53 41Q40 60 27 41Z',c),line('M40 48V69 M25 69H55',dark));}else add(path('M20 14H60L55 67H25Z',c),path('M22 17H58L56 25H24Z',cream),line('M47 54L51 7L64 5',dark),line('M29 34V55','#e6ddbd'));}
 else if(['bread','croissant','sandwich','burger','cookie','chocolate','cheese','cake','pizza'].includes(id)){
  if(id==='bread')add(path('M10 53Q4 29 23 27Q42 10 60 26Q78 27 70 59H12Z',gold),line('M25 30L20 43 M42 26L36 42 M59 31L53 45','#f1d8a1'));
  if(id==='croissant')add(path('M7 32Q40 4 73 32L64 62Q51 45 40 58Q29 45 16 62Z',gold),line('M24 24L20 50 M40 19V48 M56 24L60 50','#ad744d'));
  if(id==='sandwich')add(path('M10 57L40 14L70 57Z',cream),path('M12 59H68L65 67H15Z',green),line('M21 52H59',red));
  if(id==='burger')add(path('M10 34Q12 8 40 10Q68 8 70 34Z',gold),rect(10,37,60,7,green),rect(10,45,60,11,'#76513e'),rect(12,57,56,12,gold,8));
  if(id==='cookie'){add(circle(40,40,30,gold));for(const[x,y]of[[25,25],[49,23],[54,46],[31,50],[39,37]])add(circle(x,y,4,'#795441'));}
  if(id==='chocolate'){add(rect(14,12,52,58,'#805b46'));for(let y=18;y<65;y+=16)for(let x=20;x<60;x+=16)add(rect(x,y,12,12,'#aa7d5c',2));}
  if(id==='cheese')add(path('M10 56L18 26L65 18L70 55L10 68Z','#d5bb70'),circle(31,45,6,'#b89652'),circle(52,50,4,'#b89652'));
  if(id==='cake')add(path('M13 32L60 17L69 32V65H13Z','#d2ac89'),rect(13,37,56,8,cream),rect(13,53,56,7,cream),circle(44,22,8,red));
  if(id==='pizza')add(path('M10 20Q40 2 70 20L40 71Z','#ddbd77'),line('M13 20Q40 6 67 20',gold),circle(33,30,6,red),circle(50,28,5,red),circle(41,49,5,red));
 }
 else if(['apple','orange','tomato','potato','banana','salad','fish','chicken','icecream','breakfast'].includes(id)){
  if(['apple','orange','tomato','potato'].includes(id)){add(s('ellipse',{cx:40,cy:46,rx:27,ry:25,fill:id==='orange'?'#dca45b':id==='potato'?'#bba177':red}),line('M40 23L43 9',dark),path('M43 15Q65 2 60 22Q51 24 43 15Z',green));}
  if(id==='banana')add(path('M14 14Q15 61 62 51L70 36Q54 76 23 62Q6 44 14 14Z','#dcc77e'),line('M14 15L15 7',dark));
  if(id==='salad'){add(path('M10 38H70Q64 72 40 72Q16 72 10 38Z',cream));for(const[x,y]of[[21,34],[38,26],[56,33]])add(circle(x,y,13,green));add(circle(31,37,8,red),circle(52,35,7,red));}
  if(id==='fish')add(path('M9 40L22 24L22 56Z',blue),path('M22 40Q48 5 72 40Q48 75 22 40Z','#a6c3ba'),circle(59,34,3,dark),line('M45 27Q39 40 45 53',blue));
  if(id==='chicken')add(path('M22 24Q50 5 61 27Q76 53 49 59Q24 65 22 43Z',gold),line('M27 52L13 65 M13 65L7 59 M13 65L18 72',cream));
  if(id==='icecream')add(path('M23 35H57L40 75Z',gold),circle(40,27,23,'#d3ac9c'),circle(29,25,7,cream));
  if(id==='breakfast')add(s('ellipse',{cx:40,cy:45,rx:33,ry:25,fill:cream}),s('ellipse',{cx:37,cy:42,rx:20,ry:14,fill:'#fff3d8'}),circle(37,42,8,'#d8b16c'),line('M58 28L63 55',red));
 }
 else if(['shirt','coat','dress','swimsuit','pants','tie','scarf','hat','cap','shoe'].includes(id)){
  if(['shirt','coat','dress','swimsuit'].includes(id)){add(path(id==='dress'?'M27 10H53L50 28L68 68H12L30 28Z':'M24 12L9 27L18 40L25 33V68H55V33L62 40L71 27L56 12L46 18H34Z',id==='coat'?gold:id==='dress'?red:blue),line('M35 15Q40 28 46 15',cream));if(id==='coat')add(line('M40 28V66',dark),circle(46,40,2,dark),circle(46,52,2,dark));}
  if(id==='pants')add(path('M19 10H61L65 70H45L40 34L35 70H15Z',blue),line('M20 23H60',dark));
  if(id==='tie')add(path('M29 10H51L46 25L55 62L40 75L25 62L34 25Z',red),line('M30 14L46 25',cream));
  if(id==='scarf')add(path('M15 15Q42 4 64 19L59 33H44V70H26V35L15 30Z',red),line('M30 52H41 M30 61H41',cream));
  if(id==='hat')add(s('ellipse',{cx:40,cy:56,rx:34,ry:11,fill:gold}),path('M22 49L26 18Q40 8 54 18L58 49Z',gold),line('M25 42H55',dark));
  if(id==='cap')add(path('M14 46Q11 14 43 14Q65 15 65 48L76 59H39L14 46Z',blue),line('M42 19V48',cream));
  if(id==='shoe')add(path('M18 20L35 24L35 38L63 46Q76 51 70 64H11V37Z',gold),line('M12 61H71 M35 40L43 34 M42 45L50 39',cream));
 }
 else if(['bag','backpack','suitcase','bucket'].includes(id)){add(rect(15,24,50,47,id==='bucket'?blue:gold,8),line('M27 25V13Q40 3 53 13V25',dark));if(id==='backpack')add(rect(25,44,30,20,red,5));if(id==='suitcase')add(line('M27 29V67 M53 29V67',cream),circle(23,73,4,dark),circle(58,73,4,dark));}
 else if(['book','guidebook','citymap','timetable','ticket','postcard','newspaper','magazine','bill','password'].includes(id)){add(rect(12,11,56,59,['book','guidebook','magazine'].includes(id)?blue:cream,3),line('M22 12V70',gold));if(id==='citymap')add(line('M24 20L37 32L51 21L60 38L45 52L56 64 M31 16L32 62',green));else if(id==='password')add(circle(34,37,3,dark),circle(45,37,3,dark),circle(56,37,3,dark));else{add(rect(29,22,28,17,id==='postcard'?green:gold,2));for(let y=47;y<65;y+=8)add(line(`M29 ${y}H58`,dark));}}
 else if(['phone','camera','alarm','watch','bulb','candle','key','ring'].includes(id)){
  if(id==='phone')add(rect(23,5,34,70,dark,8),rect(28,14,24,47,blue,2),circle(40,68,3,cream));
  if(id==='camera')add(rect(8,23,64,43,dark,8),rect(19,13,19,14,dark),circle(43,44,18,gold),circle(43,44,12,blue),circle(62,31,3,cream));
  if(['alarm','watch'].includes(id)){if(id==='watch')add(rect(30,0,20,80,gold));add(circle(40,41,27,dark),circle(40,41,21,cream),line('M40 24V41L53 48',dark));if(id==='alarm')add(circle(20,13,10,gold),circle(60,13,10,gold),line('M23 63L17 74 M57 63L63 74',dark));}
  if(id==='bulb')add(path('M27 52Q3 20 24 9Q48 -8 65 20Q72 37 53 52L50 65H30Z','#e0ca86'),line('M30 66H50 M31 72H49 M35 49L30 29L40 38L50 29L45 49',gold));
  if(id==='candle')add(rect(25,35,30,38,cream),path('M40 4Q65 28 40 35Q15 28 40 4Z','#d2a165'),line('M40 30V40',dark));
  if(id==='key')add(circle(26,26,15,gold),circle(26,26,7,cream),line('M37 37L65 65 M52 52L60 44 M60 60L68 52',gold));
  if(id==='ring')add(circle(40,47,23,gold),circle(40,47,16,cream),path('M27 15L40 5L53 15L40 31Z',blue));
 }
 else if(['taxi','car','bike'].includes(id)){if(id==='bike')add(circle(18,55,14,dark),circle(64,55,14,dark),line('M18 55L32 29L46 55H18 M32 29L58 29L64 55 M27 21H39 M58 29L56 17H65',gold));else add(path('M7 36L20 17H55L68 36H75V61H5V36Z',id==='taxi'?gold:blue),path('M25 23H36V36H17Z',cream),path('M41 23H52L61 36H41Z',cream),circle(20,62,9,dark),circle(61,62,9,dark));}
 else if(id==='umbrella')add(path('M6 39Q40 -11 74 39Q61 28 51 39Q40 27 29 39Q17 28 6 39Z',red),line('M40 14V65Q40 81 25 69',dark));
 else if(['soap','shampoo','sunscreen','sponge'].includes(id)){add(rect(17,22,46,45,id==='sponge'?gold:id==='soap'?green:blue,12));if(id!=='sponge'&&id!=='soap')add(rect(28,8,24,17,cream),circle(40,44,12,cream));else add(circle(28,37,3,cream),circle(47,48,4,cream),circle(51,32,3,cream));}
 else if(['knife','spoon','toothbrush','broom','pen'].includes(id)){add(line('M25 70L50 16',gold));if(id==='spoon')add(s('ellipse',{cx:53,cy:15,rx:11,ry:16,fill:blue,transform:'rotate(25 53 15)'}));if(id==='knife')add(path('M47 15L57 5Q64 29 42 42Z',blue));if(id==='toothbrush')add(rect(44,9,18,20,cream));if(id==='broom')add(path('M22 48L39 55L33 76L7 65Z',gold),line('M18 54L13 67 M26 57L22 71',dark));if(id==='pen')add(path('M24 64L19 78L31 70Z',dark));}
 else if(id==='plate')add(circle(40,40,33,cream),circle(40,40,24,'#c4cfb6'),circle(40,40,20,cream));
 else if(id==='plant')add(path('M23 47H57L52 74H28Z',red),line('M40 50V10',dark),path('M39 37Q9 29 16 12Q40 12 39 37Z',green),path('M41 28Q67 20 64 3Q43 2 41 28Z',green));
 else if(id==='chair')add(rect(19,6,42,35,gold),rect(13,43,54,12,gold),line('M21 51V75 M59 51V75 M25 40V15 M55 40V15',dark));
 else if(id==='blanket')add(rect(10,15,60,50,blue),path('M10 15H70V29H10Z',cream),line('M14 65V73 M25 65V73 M37 65V73 M49 65V73 M61 65V73',gold));
 else if(id==='room')add(path('M10 32L40 8L70 32V70H10Z',gold),rect(27,35,26,35,dark),circle(47,54,2,cream));
 else add(rect(18,15,44,53,gold),circle(40,40,13,cream));
 return a;
}

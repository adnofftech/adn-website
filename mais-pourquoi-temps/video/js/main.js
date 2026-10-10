(function(){
const R=RIG,P=R.props,tl=gsap.timeline({paused:true}),S={};SCN.forEach(s=>S[s.id]=s);
const cam=id=>document.querySelector('#s'+id+' .cam'), bg=id=>document.querySelector('#s'+id+' .bg');
function sc(id,col,fn){const s=S[id];bg(id).setAttribute('fill',col);fn(cam(id),s.start,s.end-s.start);}
const G=(p)=>P.ground(p,820,'#bfe3a8');
const BG=['#fff3c4','#d9ebff','#d8f5e4','#ffe3cf','#e7ddff','#ffd9d3','#d4f2f0','#f3ead7'];
const POS=[R.poses.point_right,R.poses.think,R.poses.shrug,R.poses.cheer,R.poses.hold_front];
const FACE=['happy','think','surprised','big','neutral'];
function wrap(str){const w=str.split(' '),l=[''];w.forEach(x=>{if((l[l.length-1]+' '+x).trim().length>16&&l[l.length-1])l.push(x);else l[l.length-1]=(l[l.length-1]+' '+x).trim();});return l;}
function draw(g,spec,x,y){let e;const k=spec[0];
 if(k.startsWith('txt:')){e=R.g(g);R.place(e,x,y);R.text(e,k.slice(4),0,30,120,R.pal.red,{stroke:R.INK,'stroke-width':5,'paint-order':'stroke'});}
 else e=({clock:()=>P.clock(g,x,y,95),calendar:()=>P.calendar(g,x,y,170),brain:()=>P.brain(g,x,y,1.2),bulb:()=>P.bulb(g,x,y,1.4),hourglass:()=>P.hourglass(g,x,y,1.3),star:()=>P.star(g,x,y,80),book:()=>P.book(g,x,y,170),phone:()=>P.phone(g,x,y,1.3),heart:()=>P.heart(g,x,y,1.8),check:()=>P.check(g,x,y,2),cross:()=>P.cross(g,x,y,2),gear:()=>P.gear(g,x,y,80),magnifier:()=>P.magnifier(g,x,y,1.6),flag:()=>P.flag(g,x,y+60),photo:()=>P.photo(g,x,y,150),tree:()=>P.tree(g,x,y+40,1.2),cloud:()=>P.cloud(g,x,y,1.4),house:()=>P.house(g,x,y+60,1.2),lamp:()=>P.lamp(g,x,y+60,1.2),sun:()=>P.sun(g,x,y,55),qmark:()=>P.qmark(g,x,y+40,1.8)}[k]||(()=>P.star(g,x,y,70)))();
 const L=R.g(g);wrap(spec[1]).forEach((ln,i)=>R.text(L,ln,x,y+130+i*46,40));return [e,L];}
SCN.forEach((s,n)=>{const c=cam(s.id),t=s.start,d=s.end-s.start;bg(s.id).setAttribute('fill',BG[s.bg]);P.ground(c,800,'#bfe3a8');
 const m=R.stick(c,{x:330,y:800,s:1.05});m.set(R.poses.idle);m.setFace('happy');
 const ti=R.text(c,s.title,1060,120,76,R.INK);R.pop(tl,ti,t+.15,.45);
 const N=s.items.length,step=Math.max(.8,Math.min(2.2,(d-1.6)/N));let xs;
 if(s.mode==='compare')xs=[[820,470],[1480,470]];else{const w=1000/N;xs=s.items.map((_,i)=>[770+w*(i+.5),470]);}
 if(s.mode==='bubble'){const b=P.bubble(c,1230,430,980,440);R.pop(tl,b,t+.3,.5);}
 if(s.mode==='compare')R.text(c,'vs',1150,490,70,R.INK,{opacity:.55});
 s.items.forEach((it,i)=>{const at=t+.8+i*step,[x,y]=xs[i]||xs[xs.length-1],[e,L]=draw(c,it,x,y);R.pop(tl,e,at,.45);R.fadeIn(tl,L,at+.2,.3);
  R.bob(tl,e,at+.6,Math.max(1,s.end-at-.6),8,1.4);
  m.pose(tl,at-.1,.5,POS[(n+i)%POS.length]);m.pose(tl,at-.1,.1,{face:FACE[(n+i)%FACE.length]});});
 m.pose(tl,t+.2,.4,{face:'happy'});R.camera(tl,c,t,d,{scale:1.05});});
// sous-titres karaoké
const caps=document.getElementById('caps'),end=SCN[SCN.length-1].end,W=WORDS.filter(w=>w[1]<end);let grp=[],gs=[];
W.forEach((w,i)=>{grp.push(w);const txt=grp.map(x=>x[0]).join(' ');if(/[.?!…]$/.test(w[0])||grp.length>=5||txt.length>34){gs.push(grp);grp=[];}});if(grp.length)gs.push(grp);
gs.forEach((g,k)=>{const el=document.createElement('div');el.className='cap';g.forEach((w,j)=>{const i=document.createElement('i');i.id='w'+k+'_'+j;i.textContent=w[0];el.appendChild(i);});caps.appendChild(el);
 const s=g[0][1],e=(gs[k+1]?gs[k+1][0][1]:g[g.length-1][2]+.4);tl.fromTo(el,{opacity:0},{opacity:1,duration:.12},s);
 g.forEach((w,j)=>{tl.fromTo('#w'+k+'_'+j,{color:'#1c2033'},{color:'#e0552c',duration:.1},w[1]);tl.to('#w'+k+'_'+j,{color:'#1c2033',duration:.1},Math.max(w[1]+.15,w[2]));});tl.to(el,{opacity:0,duration:.1},e-.1);});
window.__timelines=window.__timelines||{};window.__timelines['main']=tl;window.__tl=tl;
})();

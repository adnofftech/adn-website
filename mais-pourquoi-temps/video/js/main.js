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
const hs=(i,k)=>{let x=Math.sin(i*127.1+k*311.7)*43758.5453;return x-Math.floor(x);};
function ring(c,x,y,t,col){const r=R.circle(c,x,y,20,'none',{stroke:col||R.pal.orange,'stroke-width':8});tl.fromTo(r,{scale:.2,opacity:1,transformOrigin:x+'px '+y+'px'},{scale:4.5,opacity:0,duration:.55,ease:'power2.out'},t);
 for(let i=0;i<6;i++){const sp=P.sparkle(c,x,y,16);const a=i*1.047+.3;tl.fromTo(sp,{opacity:1,scale:.4},{x:x+Math.cos(a)*150,y:y+Math.sin(a)*150,opacity:0,scale:1.4,duration:.6,ease:'power2.out'},t);}}
SCN.forEach((s,n)=>{const c=cam(s.id),t=s.start,d=s.end-s.start,svg=c.parentNode;bg(s.id).setAttribute('fill',BG[s.bg]);
 const dots=R.g(c);for(let i=0;i<14;i++){const x=hs(n,i)*1920,y=hs(n,i+30)*760,r=14+hs(n,i+60)*40;const o=R.circle(dots,x,y,r,'#ffffff',{'stroke-width':0,opacity:.35});tl.fromTo(o,{y:0},{y:-90-hs(n,i+90)*120,x:(hs(n,i+5)-.5)*120,duration:d,ease:'none'},t);}
 P.ground(c,800,'#bfe3a8');
 const m=R.stick(c,{x:330,y:800,s:1.05});m.set(R.poses.idle);m.setFace('happy');tl.from(m.root,{x:-420,duration:.55,ease:'back.out(1.6)'},t+.05);for(let i=0;i<3;i++){const l=R.line(c,40,600+i*70,200,600+i*70,{'stroke-width':6,opacity:.5});tl.fromTo(l,{opacity:.6,x:0},{opacity:0,x:-120,duration:.4,ease:'power2.out'},t+.05+i*.04);}
 const ti=R.text(c,s.title,1060,120,76,R.INK);tl.fromTo(ti,{scale:2.2,opacity:0,rotation:-6,transformOrigin:'1060px 100px'},{scale:1,opacity:1,rotation:0,duration:.45,ease:'back.out(1.8)'},t+.15);const ul=R.line(c,760,148,1360,148,{stroke:R.pal.orange,'stroke-width':10});tl.fromTo(ul,{scaleX:0,transformOrigin:'760px 148px'},{scaleX:1,duration:.5,ease:'power3.out'},t+.5);
 const N=s.items.length,step=Math.max(.8,Math.min(2.2,(d-1.6)/N));let xs;
 if(s.mode==='compare')xs=[[820,470],[1480,470]];else{const w=1000/N;xs=s.items.map((_,i)=>[770+w*(i+.5),470]);}
 if(s.mode==='bubble'){const b=P.bubble(c,1230,430,980,440);R.pop(tl,b,t+.3,.5);}
 if(s.mode==='compare')R.text(c,'vs',1150,490,70,R.INK,{opacity:.55});
 s.items.forEach((it,i)=>{const at=t+.8+i*step,[x,y]=xs[i]||xs[xs.length-1],[e,L]=draw(c,it,x,y);R.pop(tl,e,at,.45);R.fadeIn(tl,L,at+.2,.3);ring(c,x,y,at,[R.pal.orange,R.pal.blue,R.pal.green,R.pal.pink][i%4]);tl.to(svg,{scale:1.05,duration:.1,yoyo:true,repeat:1,ease:'power2.out',transformOrigin:'960px 540px'},at);
  R.bob(tl,e,at+.6,Math.max(1,s.end-at-.6),8,1.4);
  m.pose(tl,at-.1,.5,POS[(n+i)%POS.length]);m.pose(tl,at-.1,.1,{face:FACE[(n+i)%FACE.length]});});
 m.pose(tl,t+.2,.4,{face:'happy'});tl.fromTo(c,{scale:n%2?1.0:1.12,x:n%3?0:-40,transformOrigin:'960px 540px'},{scale:n%2?1.12:1.0,x:n%3?-30:0,duration:d,ease:'sine.inOut'},t);});
const wp=document.getElementById('wipe');SCN.forEach((s,n)=>{if(!n)return;const col=['#ff9a4d','#5b8def','#46b97a','#ee5d55','#9a74e8'][n%5];tl.set(wp,{backgroundColor:col},s.start-.3);tl.fromTo(wp,{x:-1920},{x:0,duration:.3,ease:'power3.in'},s.start-.3);tl.to(wp,{x:1920,duration:.3,ease:'power3.out'},s.start);});
// sous-titres karaoké
const caps=document.getElementById('caps'),end=SCN[SCN.length-1].end,W=WORDS.filter(w=>w[1]<end);let grp=[],gs=[];
W.forEach((w,i)=>{grp.push(w);const txt=grp.map(x=>x[0]).join(' ');if(/[.?!…]$/.test(w[0])||grp.length>=5||txt.length>34){gs.push(grp);grp=[];}});if(grp.length)gs.push(grp);
gs.forEach((g,k)=>{const el=document.createElement('div');el.className='cap';g.forEach((w,j)=>{const i=document.createElement('i');i.id='w'+k+'_'+j;i.textContent=w[0];el.appendChild(i);});caps.appendChild(el);
 const s=g[0][1],e=(gs[k+1]?gs[k+1][0][1]:g[g.length-1][2]+.4);tl.fromTo(el,{opacity:0},{opacity:1,duration:.12},s);
 g.forEach((w,j)=>{tl.fromTo('#w'+k+'_'+j,{color:'#1c2033'},{color:'#e0552c',duration:.1},w[1]);tl.to('#w'+k+'_'+j,{color:'#1c2033',duration:.1},Math.max(w[1]+.15,w[2]));});tl.to(el,{opacity:0,duration:.1},e-.1);});
window.__timelines=window.__timelines||{};window.__timelines['main']=tl;window.__tl=tl;
})();

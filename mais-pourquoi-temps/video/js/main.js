(function(){
const R=RIG,P=R.props,tl=gsap.timeline({paused:true}),S={};SCN.forEach(s=>S[s.id]=s);
const cam=id=>document.querySelector('#s'+id+' .cam'), bg=id=>document.querySelector('#s'+id+' .bg');
function sc(id,col,fn){const s=S[id];bg(id).setAttribute('fill',col);fn(cam(id),s.start,s.end-s.start);}
const G=(p)=>P.ground(p,820,'#bfe3a8');
// 1 : adulte rêveur, bulle avec enfant
sc('1','#fff3c4',(c,t,d)=>{G(c);const m=R.stick(c,{x:640,y:820});m.set(R.poses.think);m.setFace('think');
 const b=P.bubble(c,1180,330,520,300);const s=P.sun(b.inner,-110,0,50);const k=R.stick(b.inner,{x:90,y:90,s:.42});k.set(R.poses.run);
 R.pop(tl,b,t+.4,.5);R.pulse(tl,s,t+1,.8);tl.to(s.rays,{rotation:360,duration:d,ease:'none',transformOrigin:'0px 0px'},t);k.walk(tl,t+.8,2.4,-60,{period:.4});R.camera(tl,c,t,d,{scale:1.1});});
// 2 : pages de calendrier
sc('2','#d9ebff',(c,t,d)=>{G(c);const m=R.stick(c,{x:620,y:820});m.pose(tl,t+.2,.5,R.poses.shrug);m.pose(tl,t+2.5,.4,{face:'surprised'});
 const mo=['JAN','FÉV','MAR','AVR','MAI','JUIN'];mo.forEach((n,i)=>{const k=P.calendar(c,1250,420,300,n);tl.fromTo(k,{opacity:0,scale:.5,x:1250,y:420},{opacity:1,scale:1,duration:.25},t+.3+i*.7);tl.to(k,{x:1700,y:-100,rotation:40,opacity:0,duration:.5,ease:'power2.in'},t+.3+i*.7+.55);});});
// 3 : Noël, horloge régulière
sc('3','#d8f5e4',(c,t,d)=>{G(c);const m=R.stick(c,{x:520,y:820});m.pose(tl,t,.3,{face:'sleepy'});m.pose(tl,t+1.2,.2,{face:'surprised'});
 const tr=P.tree(c,1100,820,1.6);R.pop(tl,tr,t+1.2,.4);R.text(tr,'🎄',0,-80,80);const ck=P.clock(c,1500,430,140);R.fadeIn(tl,ck,t+2,.4);P.tick(tl,ck,t+2,2.2,2);});
// 4 : perplexe + horloge qui valide
sc('4','#ffe3cf',(c,t,d)=>{G(c);const m=R.stick(c,{x:560,y:820});m.set(R.poses.shrug);m.setFace('think');
 [0,1,2].forEach(i=>{const q=P.qmark(c,430+i*110,430-(i%2)*40,.8);R.pop(tl,q,t+.5+i*.4);R.bob(tl,q,t+1.2,4,12,1);});
 const ck=P.clock(c,1350,450,170);P.tick(tl,ck,t,d,3);const ok=P.check(c,1560,300,1.3);R.pop(tl,ok,t+3.6);});
// 5 : cerveau transparent
sc('5','#e7ddff',(c,t,d)=>{G(c);const m=R.stick(c,{x:700,y:820,s:1.2});m.pose(tl,t,.4,R.poses.point_right);
 const br=P.brain(c,700,448,1.3);R.pop(tl,br,t+.5,.5);R.bob(tl,br,t+1,5,8,1.2);
 [P.gear(c,1150,360,70,'#ffd35c'),P.gear(c,1290,470,50,'#5b8def')].forEach((g,i)=>{R.pop(tl,g,t+1+i*.4);tl.to(g,{rotation:i?-360:360,duration:6,ease:'none',transformOrigin:'0px 0px'},t+1);});
 R.camera(tl,c,t,d,{scale:1.12});});
// 6 : balance horloge / album
sc('6','#fff3c4',(c,t,d)=>{G(c);const m=R.stick(c,{x:420,y:820});m.pose(tl,t+1,.5,R.poses.point_right);
 const w=R.g(c);R.place(w,1150,620);R.line(w,0,0,0,200);R.line(w,-140,200,140,200,{});const beam=R.g(w);R.place(beam,0,0);R.line(beam,-230,0,230,0);
 const l=R.g(beam);R.place(l,-230,0);const cl=P.clock(l,0,160,70);const r=R.g(beam);R.place(r,230,0);const al=P.photo(r,0,150,120);
 tl.to(beam,{rotation:-12,duration:.9,ease:'back.out(2)',transformOrigin:'0px 0px'},t+1.2);tl.to([l,r],{rotation:12,duration:.9,transformOrigin:'0px 0px'},t+1.2);R.line(l,0,0,0,90,{'stroke-width':5});R.line(r,0,0,0,80,{'stroke-width':5});});
// sous-titres karaoké
const caps=document.getElementById('caps'),end=SCN[SCN.length-1].end,W=WORDS.filter(w=>w[1]<end);let grp=[],gs=[];
W.forEach((w,i)=>{grp.push(w);const txt=grp.map(x=>x[0]).join(' ');if(/[.?!…]$/.test(w[0])||grp.length>=5||txt.length>34){gs.push(grp);grp=[];}});if(grp.length)gs.push(grp);
gs.forEach((g,k)=>{const el=document.createElement('div');el.className='cap';g.forEach((w,j)=>{const i=document.createElement('i');i.id='w'+k+'_'+j;i.textContent=w[0];el.appendChild(i);});caps.appendChild(el);
 const s=g[0][1],e=(gs[k+1]?gs[k+1][0][1]:g[g.length-1][2]+.4);tl.fromTo(el,{opacity:0},{opacity:1,duration:.12},s);
 g.forEach((w,j)=>{tl.fromTo('#w'+k+'_'+j,{color:'#1c2033'},{color:'#e0552c',duration:.1},w[1]);tl.to('#w'+k+'_'+j,{color:'#1c2033',duration:.1},Math.max(w[1]+.15,w[2]));});tl.to(el,{opacity:0,duration:.1},e-.1);});
window.__timelines=window.__timelines||{};window.__timelines['main']=tl;window.__tl=tl;
})();

const {chromium}=require('playwright');
const OUT=(process.argv[2]||'.')+'/assets/shots/';
(async()=>{const b=await chromium.launch();
async function go(p,u){await p.goto(u);await p.waitForTimeout(1500);await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(900)}
let p=await b.newPage({viewport:{width:1440,height:900}});
await go(p,'http://localhost:8126/index.html');await p.screenshot({path:OUT+'hero.png'});
await p.screenshot({path:OUT+'home-full.png',fullPage:true});
const sec=await p.$('.reviews');await sec.screenshot({path:OUT+'avis.png'});
const bento=await p.$('.bento');await bento.screenshot({path:OUT+'bento.png'});
await go(p,'http://localhost:8126/la-carte.html');await p.screenshot({path:OUT+'carte-full.png',fullPage:true});
await go(p,'http://localhost:8126/galerie.html');await p.screenshot({path:OUT+'galerie.png'});
await p.close();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
p=await ctx.newPage();await go(p,'http://localhost:8126/index.html');await p.screenshot({path:OUT+'mobile-hero.png'});
await p.screenshot({path:OUT+'mobile-full.png',fullPage:true});
await go(p,'http://localhost:8126/la-carte.html');await p.screenshot({path:OUT+'mobile-carte.png',fullPage:true});
await b.close()})();

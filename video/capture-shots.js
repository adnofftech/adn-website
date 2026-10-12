const {chromium}=require('playwright');
const OUT=(process.argv[2]||'.')+'/assets/shots/';
(async()=>{const b=await chromium.launch();
async function go(p,u){await p.goto(u);await p.waitForTimeout(1500);await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(900)}
let p=await b.newPage({viewport:{width:1440,height:900}});
await go(p,'http://localhost:8000/index.html');await p.screenshot({path:OUT+'hero.png'});
await p.addStyleTag({content:'.mast{display:none!important}'});await p.waitForTimeout(300);const m=await p.$('.menu-block');await m.screenshot({path:OUT+'menu.png'});
await p.close();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
p=await ctx.newPage();await go(p,'http://localhost:8000/index.html');await p.screenshot({path:OUT+'mobile-full.png',fullPage:true});
await b.close()})();

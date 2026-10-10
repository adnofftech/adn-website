import { createRequire } from 'module'; const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('file://'+process.cwd()+'/mini.html'); await p.waitForTimeout(800);
await p.screenshot({ path: 'miniature.png' }); await b.close();

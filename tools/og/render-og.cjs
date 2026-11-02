// Renders 1200x630 social preview cards into /media/og/.
// Needs Playwright with Chromium (not part of npm ci): node tools/og/render-og.cjs
const path=require('path'),fs=require('fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const copy=JSON.parse(fs.readFileSync(path.join(root,'tools/seo-copy.json'),'utf8'));
const tagline={en:['Free','Open source','No tracking'],ru:['Бесплатно','Открытый код','Без слежки'],uk:['Безкоштовно','Відкритий код','Без стеження']};
const sub={'video-glow':{en:'Extension for Chrome and Firefox',ru:'Расширение для Chrome и Firefox',uk:'Розширення для Chrome і Firefox'},'video-drift':{en:'Extension for Chrome and Firefox',ru:'Расширение для Chrome и Firefox',uk:'Розширення для Chrome і Firefox'}};
const names={'video-glow':'Video Glow','video-drift':'Video Drift'};
const ids=['video-glow','leveler','video-drift','snapt','uni-homebot'],labels=['Video Glow','Leveler','Video Drift','Snapt','UNI'];
const file=p=>`data:${p.endsWith('.svg')?'image/svg+xml':'image/webp'};base64,`+fs.readFileSync(path.join(root,p)).toString('base64');
const css=`*{box-sizing:border-box}body{margin:0}
.c{width:1200px;height:630px;background:#0a0a0b;color:#f3f2ef;font-family:Inter,system-ui,sans-serif;position:relative;overflow:hidden}
.g{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 78% 55%,#9e7dff2e,transparent 70%),radial-gradient(ellipse 50% 60% at 0% 100%,#69bcdf14,transparent 70%)}
.brand{position:absolute;left:72px;top:60px;font-size:28px;font-weight:800;letter-spacing:-.04em}.brand small{font-size:15px;font-weight:500;color:#a2a1aa;margin-right:7px;letter-spacing:0}
.tag{display:flex;gap:14px;align-items:center;font-size:21px;color:#a2a1aa}.tag i{width:5px;height:5px;border-radius:50%;background:#a98bff;box-shadow:0 0 12px #a98bff}
h1{font-weight:800;letter-spacing:-.05em;line-height:1.05;margin:0}
h1 em{font-style:normal;background:linear-gradient(100deg,#f29c92,#ac96fa 55%,#69bcdf);-webkit-background-clip:text;background-clip:text;color:transparent}
.tile{width:84px;height:84px;padding:16px;border-radius:26px;background:#131315;border:1px solid #27272c;box-shadow:0 18px 44px #0007}`;
const tagHtml=l=>`<div class="tag">${tagline[l].map((t,i)=>(i?'<i></i>':'')+t).join('')}</div>`;
function hub(l){const h1=copy.hub[l][1];return `<div class="c"><div class="g"></div><div class="brand"><small>by</small>vKardin</div>
<div style="position:absolute;left:72px;right:72px;top:150px"><h1 style="font-size:60px;max-width:1000px">${h1}</h1></div>
<div style="position:absolute;left:72px;bottom:66px;right:72px;display:flex;justify-content:space-between;align-items:flex-end">${tagHtml(l)}
<div style="display:flex;gap:14px">${ids.map(i=>`<img class="tile" style="width:76px;height:76px;padding:14px;border-radius:24px" src="${file('family-assets/'+i+'.svg')}">`).join('')}</div></div></div>`;}
function product(id,l){const h1=copy[id][l][1];return `<div class="c"><div class="g"></div><div class="brand"><small>by</small>vKardin</div>
<div style="position:absolute;left:72px;top:150px;width:470px;display:flex;flex-direction:column;gap:22px">
<div style="display:flex;align-items:center;gap:16px"><img class="tile" style="width:64px;height:64px;padding:12px;border-radius:20px" src="${file('family-assets/'+id+'.svg')}"><div style="font-size:30px;font-weight:800;letter-spacing:-.03em">${names[id]}</div></div>
<h1 style="font-size:46px">${h1}</h1></div>
<div style="position:absolute;left:72px;bottom:60px">${tagHtml(l)}</div>
<img src="${file('media/'+id+'-'+l+'.webp')}" style="position:absolute;right:-40px;top:96px;width:640px;border-radius:22px;border:1px solid #27272c;box-shadow:0 30px 80px #000a"></div>`;}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
const jobs=[];for(const l of ['en','ru','uk']){jobs.push(['hub',l,hub(l)]);for(const id of ['video-glow','video-drift'])jobs.push([id,l,product(id,l)]);}
for(const [id,l,body] of jobs){await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;800&display=swap"><style>${css}</style></head><body>${body}</body></html>`,{waitUntil:'networkidle'});
await p.waitForTimeout(300);await p.screenshot({path:path.join(root,`media/og/${id}-${l}.png`)});}
await b.close();console.log('rendered',jobs.length)})();

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const origin='https://vkardin.github.io';
const urls=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(urls.length,39);
const docs=new Map();
for(const url of urls){const p=new URL(url).pathname;docs.set(url,new JSDOM(read(p.slice(1)+(p.endsWith('/')?'index.html':'')),{url}).window.document);}
const errors=[];
const check=(ok,msg)=>{if(!ok)errors.push(msg);};
for(const [url,doc] of docs){
 const lang=doc.documentElement.lang;
 check(['ru','uk','en'].includes(lang),url+': language');
 check(doc.querySelectorAll('h1').length===1&&doc.querySelector('h1').textContent.trim().length>2,url+': H1');
 check(doc.querySelectorAll('main').length===1,url+': main landmark');
 check(doc.querySelectorAll('title').length===1&&doc.title.length>10,url+': title');
 check(doc.querySelectorAll('meta[name="description"]').length===1&&doc.querySelector('meta[name="description"]').content.length>40,url+': description');
 check(doc.querySelectorAll('link[rel="canonical"]').length===1&&doc.querySelector('link[rel="canonical"]').href===url,url+': canonical');
 check(doc.querySelector('link[rel="canonical"]').getAttribute('href')===url,url+': absolute canonical attribute');
 for(const selector of ['.langs','.hub-languages']){
  const links=[...doc.querySelectorAll(selector+' a[hreflang]')];
  if(links.length)check(links.map(a=>a.hreflang).join(',')==='en,ru,uk',url+': language order');
 }
 for(const l of ['ru','uk','en','x-default']){
  const a=doc.querySelector(`link[hreflang="${l}"]`),target=docs.get(a?.href);
  check(!!target,url+': hreflang target '+l);
  check(a?.getAttribute('href').startsWith(origin+'/'),url+': absolute hreflang '+l);
  if(target&&l!=='x-default'){
   check(target.documentElement.lang===l,url+': hreflang language '+l);
   check(target.querySelector(`link[hreflang="${lang}"]`)?.href===url,url+': reciprocal hreflang '+l);
  }
 }
 check(!doc.querySelector('meta[http-equiv="refresh"]'),url+': automatic redirect');
 for(const e of doc.querySelectorAll('script:not([src])'))check(!e.textContent.includes('location.replace'),url+': JS redirect');
 const schema=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
 check(schema.url===url&&schema.inLanguage===lang,url+': structured data');
 const image=doc.querySelector('meta[property="og:image"]').content;
 check(image.startsWith(origin+'/'),url+': absolute OG image');
 check(fs.existsSync(path.join(root,new URL(image).pathname)),url+': OG image exists');
 for(const e of doc.querySelectorAll('a[href],img[src],script[src],link[href]')){
  const v=e.getAttribute('src')||e.getAttribute('href');if(!v||/^(data:|mailto:|tel:)/.test(v))continue;
  const u=new URL(v,url);if(u.origin!==origin)continue;
  // Коли Є is published from its own repository.
  if(u.pathname.startsWith('/koly/'))continue;
  const p=u.pathname,local=path.join(root,p,p.endsWith('/')?'index.html':'');
  check(fs.existsSync(local),url+': missing '+u.pathname);
  if(e.tagName==='A'&&u.hash&&fs.existsSync(local)&&/\.html$/.test(local)){
   const target=docs.get(u.origin+p)||(u.origin+p===url?doc:null);
   // Generic external project anchors can point to generated pages outside sitemap.
   if(target)check(!!target.getElementById(decodeURIComponent(u.hash.slice(1))),url+': missing anchor '+u.href);
  }
 }
 doc.querySelectorAll('[data-i18n]').forEach(e=>check(!!e.textContent.trim()||e.tagName==='INPUT',url+': empty translated '+e.dataset.i18n));
 for(const img of doc.querySelectorAll('img[srcset]'))for(const candidate of img.srcset.split(',')){
  check(fs.existsSync(path.join(root,candidate.trim().split(/\s+/)[0])),url+': responsive image');
 }
}
// Test entry URL negotiation without a browser or any navigation side effects.
const negotiate=(preferences,explicit,saved,pathname='/',hash='',search='')=>{
 let destination=null;
 const ctx={document:{documentElement:{dataset:{localeBase:'/',siteProject:'hub'},lang:'en'}},navigator:{languages:preferences},location:{pathname,hash,search:explicit?'?lang='+explicit:search,replace:p=>destination=p},localStorage:{getItem:k=>k==='vkardin-site-language-choice'?saved:null,setItem(){}},URLSearchParams};
 vm.runInNewContext(read('family-head.js'),ctx);return destination;
};
assert.equal(negotiate(['ru-RU']),'/ru/');
assert.equal(negotiate(['uk-UA']),'/uk/');
assert.equal(negotiate(['de-DE','ru-UA']),'/ru/');
assert.equal(negotiate(['de-DE','fr-FR']),null);
assert.equal(negotiate(['en-GB','ru-RU']),null);
assert.equal(negotiate(['ru-RU'],null,'en'),null);
assert.equal(negotiate(['en-US'],null,'uk'),'/uk/');
assert.equal(negotiate(['ru-RU'],'en'),null);
assert.equal(negotiate(['uk-UA'],null,null,'/support.html','#help','?ref=site'),'/uk/support.html?ref=site#help');
// Exercise existing scripts on localized HTML with opposite saved preferences.
// No network is enabled: release lookup and feedback submissions cannot run.
for(const [url] of docs){
 const p=new URL(url).pathname,errorsHere=[];
 const dom=new JSDOM(read(p.slice(1)+(p.endsWith('/')?'index.html':'')),{url,runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window,d=w.document,expected={lang:d.documentElement.lang,title:d.title,h1:d.querySelector('h1').textContent,description:d.querySelector('meta[name="description"]').content};
 for(const k of ['vkardin-site-language','vg-lang','lv-lang','video-drift-lang','lang'])w.localStorage.setItem(k,expected.lang==='en'?'ru':'en');
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.fetch=()=>Promise.reject(Error('Network disabled in smoke test'));
 // Canvas demos are verified in the browser; omit only their setup here.
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:20}):()=>{}});
 w.addEventListener('error',e=>errorsHere.push(e.error?.message||e.message));
 for(const script of [...d.querySelectorAll('script')]){
  if(script.type==='application/ld+json')continue;
  const src=script.getAttribute('src');
  let code=src?read(new URL(src,url).pathname.slice(1)):script.textContent;
  if(src&&/(demo\.js|demo-controls\.js)/.test(src))continue;
  // jsdom does not implement painting or IntersectionObserver.
  code=code.replace('setupDemo();','');
  try{w.eval(code);}catch(e){errorsHere.push((src||'inline')+': '+e.message);}
 }
 await new Promise(r=>setTimeout(r,0));
 check(errorsHere.length===0,url+': runtime '+errorsHere.join('; '));
 check(d.documentElement.lang===expected.lang,url+': saved preference overrides URL');
 check(d.title===expected.title,url+': runtime title changed');
 check(d.querySelector('h1').textContent===expected.h1,url+': runtime H1 changed');
 check(d.querySelector('meta[name="description"]').content===expected.description,url+': runtime description changed');
 dom.window.close();
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('PASS: 39 pages; metadata, reciprocal hreflang, assets, links, anchors, structured data and runtime language stability.');

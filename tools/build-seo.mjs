// Generate crawlable translations from the original markup and existing dictionaries.
// No network or browser is needed. Edit tools/templates and seo-copy.json, then npm run build.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root,p), 'utf8');
const write = (p,s) => {fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);};
const copy = JSON.parse(read('tools/seo-copy.json'));
const langs = ['en','ru','uk'];
const origin = 'https://vkardin.github.io';
const projectPath = id => id==='hub' ? '/' : `/${id}/`;
// English is always the unprefixed entry; translations have stable URLs.
export const pagePath = (id,lang,kind='index') => {
  const base=projectPath(id);
  return base+(lang==='en'?'':lang+'/')+(kind==='index'?'':kind+'.html');
};
function objectFrom(code,name,end) {
  const start=code.indexOf(`const ${name} = `)>=0 ? code.indexOf(`const ${name} = `) : code.indexOf(`const ${name}=`);
  if(start<0)throw Error(`Missing dictionary ${name}`);
  return vm.runInNewContext(code.slice(start,code.indexOf(end,start))+`;${name}`,{});
}
const family=read('family.js');
const words=JSON.parse(family.match(/const words = (.*);/)[1]);
const projects=JSON.parse(family.match(/const projects = (.*);/)[1]);
const tags=JSON.parse(family.match(/const tags=(.*);/)[1]);
const labels=vm.runInNewContext('('+family.match(/const labels=(.*);/)[1]+')');
const hub=objectFrom(read('hub.js'),'copy','\n const root');
const uni=objectFrom(read('uni-homebot/i18n.js'),'dictionary',"\ndictionary['Скопировано']");
const tables={};
for(const id of ['video-glow','leveler'])tables[id]=objectFrom(read(id+'/app.js'),'T','\nfunction pickLang');
const driftWindow={};vm.runInNewContext(read('video-drift/i18n.js'),{window:driftWindow});
const drift=driftWindow.I18N;
const urls=[];
// Store listings; cards link straight to installation where a store exists.
// Firefox-only listings: an extra card link next to Releases.
const firefox={'video-drift':'https://addons.mozilla.org/firefox/addon/video-drift-floating-player/',snapt:'https://addons.mozilla.org/firefox/addon/snapt-screenshots-images/'};
const stores={'video-glow':['https://chromewebstore.google.com/detail/bjgbalkabocifimhnhbcnomeknpbhkea','https://addons.mozilla.org/firefox/addon/video-glow/'],leveler:['https://chromewebstore.google.com/detail/phbjpipnbhffcegccfbbfabbhmgaelko','https://addons.mozilla.org/firefox/addon/leveler/']};
const repos={'video-glow':'video-glow',leveler:'leveler','video-drift':'video-drift',snapt:'snapt','uni-homebot':'uni-homebot',koly:'koly',tukk:'tukk'};
// Projects whose templates are written once per language.
const perLanguage=new Set(['snapt','tukk']);
const ogSize=image=>image.startsWith('/media/og/')||image==='/leveler/img/og.png'?[1200,630]:[1280,640];
// Smaller image candidates reduce mobile transfers without changing the desktop originals.
const responsive=new Map();
for(const id of ['video-glow','leveler','video-drift','snapt','uni-homebot','koly','tukk'])for(const lang of langs){
  const source=`media/${id}-${lang}.webp`,dest=`media/responsive/${id}-${lang}-480.webp`;
  fs.mkdirSync(path.join(root,'media/responsive'),{recursive:true});
  await sharp(path.join(root,source)).resize({width:480,withoutEnlargement:true}).webp({quality:76}).toFile(path.join(root,dest));
  responsive.set('/'+source,{small:'/'+dest,width:(await sharp(path.join(root,source)).metadata()).width});
}
for(const shot of ['glow','led','room','settings'])for(const lang of langs){
  const source=`video-glow/img/${shot}-${lang}.webp`,dest=`media/responsive/glow-${shot}-${lang}-640.webp`;
  await sharp(path.join(root,source)).resize({width:640,withoutEnlargement:true}).webp({quality:78}).toFile(path.join(root,dest));
  responsive.set('/'+source,{small:'/'+dest,width:(await sharp(path.join(root,source)).metadata()).width});
}
function translate(doc,id,lang,kind) {
  if(tables[id]) {
    const t=tables[id][lang], context={window:{}};
    doc.querySelectorAll('script:not([src])').forEach(s=>{if(s.textContent.includes('PAGE_T'))vm.runInNewContext(s.textContent,context);});
    const page=context.window.PAGE_T?.[lang]||{};
    doc.querySelectorAll('[data-i18n]').forEach(el=>{const v=t[el.dataset.i18n]??page[el.dataset.i18n];if(v!=null)el.textContent=v;});
    doc.querySelectorAll('[data-i18n-aria]').forEach(el=>{const v=t[el.dataset.i18nAria];if(v)el.setAttribute('aria-label',v);});
    doc.querySelectorAll('[data-ph]').forEach(el=>{const v=page[el.dataset.ph]??t[el.dataset.ph];if(v)el.setAttribute('placeholder',v);});
    doc.querySelectorAll('[data-href]').forEach(el=>{if(t[el.dataset.href])el.setAttribute('href',t[el.dataset.href]);});
    const list=doc.querySelector('#mlist');if(list&&t.m_list){list.replaceChildren(...t.m_list.map(s=>{const li=doc.createElement('li');li.textContent=s;return li;}));}
  }
  if(id==='video-drift')doc.querySelectorAll('[data-i18n]').forEach(el=>{const v=drift[lang][el.dataset.i18n];if(v!=null)el.innerHTML=v;});
  if(id==='uni-homebot') {
    const walker=doc.createTreeWalker(doc.body,4);
    while(walker.nextNode()) {
      const n=walker.currentNode;
      if(n.parentElement.closest('script,style,pre,code,.family-section,.family-nav,.top,[data-site-demo]'))continue;
      const k=n.nodeValue.trim();if(uni[k])n.nodeValue=n.nodeValue.replace(k,uni[k][lang]);
    }
  }
  if(id==='hub') {
    const t=hub[lang];
    doc.querySelectorAll('[data-hub]').forEach(el=>{el.innerHTML=t[el.dataset.hub];});
    doc.querySelectorAll('img[data-hub-shot]').forEach(img=>{img.src=`/media/${img.dataset.hubShot}-${lang}.webp?v=7`;});
    const nav=doc.createElement('div');nav.className='hub-languages';nav.setAttribute('aria-label','Language');
    for(const l of langs){const a=doc.createElement('a');a.hreflang=l;a.href=pagePath(id,l);a.textContent=l.toUpperCase();if(l===lang)a.setAttribute('aria-current','page');nav.append(a);}
    doc.querySelector('.family-nav-inner').append(nav);
  }
}
// One list of projects for the hub and for the "other programs" block of every product page.
const names={'video-glow':'Video Glow',leveler:'Leveler','video-drift':'Video Drift',snapt:'Snapt','uni-homebot':'UNI',koly:'Коли Є',tukk:'Tukk'};
const accents={'video-glow':'#d3b3ff',leveler:'#3ddc97','video-drift':'#63d9d0',snapt:'#b79bff','uni-homebot':'#8fb5ff',koly:'#ffc24a',tukk:'#ff7a35'};
const gets={
  'video-glow':[['Chrome',stores['video-glow'][0]],['Firefox',stores['video-glow'][1]]],
  leveler:[['Chrome',stores.leveler[0]],['Firefox',stores.leveler[1]]],
  'video-drift':[['Firefox',firefox['video-drift']]],
  snapt:[['Windows, macOS, Linux','https://github.com/vkardin/snapt/releases/latest'],['Firefox',firefox.snapt]],
  'uni-homebot':[['GitHub','https://github.com/vkardin/uni-homebot']],
  koly:[['Android','https://github.com/vkardin/koly/releases/download/android-v1.0.0/koly-1.0.0.apk'],['Windows','https://github.com/vkardin/koly/releases/download/desktop-v1.0.0/koly-widget-1.0.0-setup.exe']],
  tukk:[]
};
function familyRows(doc,id) {
  doc.querySelectorAll('.family-grid').forEach(grid=>{
    grid.innerHTML=Object.keys(names).filter(p=>p!==id).map(p=>
      `<article class="family-card"${id==='hub'?` id="${p}"`:''} style="--project-accent:${accents[p]}">`+
      `<header class="family-card-header"><span class="family-icon"><img src="/family-assets/${p}.svg" alt="" width="44" height="44" loading="lazy"></span>`+
      `<div><h3><a data-family-site="${p}" href="https://vkardin.github.io/${p}/">${names[p]}</a></h3><small data-family-type="${p}"></small></div></header>`+
      `<p data-family-description="${p}"></p><div class="family-actions">`+
      (gets[p].length?gets[p].map(([label,href])=>`<a href="${href}" rel="noopener">${label}</a>`).join(''):'<span class="family-note" data-family-word="wip"></span>')+
      `</div></article>`).join('');
  });
}
function familyLinks(doc,lang) {
  doc.querySelectorAll('a[data-family-word="download"]').forEach(a=>{const id=(a.getAttribute('href')||'').match(/github\.com\/vkardin\/([a-z-]+)\/releases/)?.[1];if(stores[id]){a.href=stores[id][0];a.dataset.familyWord='install';}else if(firefox[id]){const f=doc.createElement('a');f.href=firefox[id];f.dataset.familyWord='firefox';a.after(f);}});
  doc.querySelectorAll('[data-family-word]').forEach(e=>{e.textContent=words[lang][e.dataset.familyWord];});
  doc.querySelectorAll('[data-family-type]').forEach(e=>e.textContent=projects[e.dataset.familyType].type[lang]);
  doc.querySelectorAll('[data-family-description]').forEach(e=>e.textContent=projects[e.dataset.familyDescription].desc[lang]);
  doc.querySelectorAll('[data-family-chip]').forEach(e=>{const [id,n]=e.dataset.familyChip.split(':');e.textContent=tags[lang][id][n];});
  doc.querySelectorAll('[data-family-label]').forEach(e=>e.textContent=labels[lang][e.dataset.familyLabel]);
  doc.querySelectorAll('.family-preview').forEach(a=>{const id=new URL(a.href).pathname.split('/')[1];const img=a.querySelector('img');if(img&&projects[id]){img.src=`/media/${id}-${lang}.webp?v=7`;}});
}
const captions={ru:['Подсветка видео','Режим LED-ленты','Цвет комнаты','Настройки Video Glow'],uk:['Підсвічування відео','Режим LED-стрічки','Колір кімнати','Налаштування Video Glow'],en:['Video ambient light','LED strip mode','Room colour','Video Glow settings']};
function render(id,lang,kind) {
  const source=(id==='hub'?'hub':id)+(perLanguage.has(id)?'-'+lang:'')+'-'+kind+'.html.in';
  const sourcePath=id==='hub'?'/':perLanguage.has(id)&&lang!=='en'?`/${id}/${lang}/`:`/${id}/`;
  const dom=new JSDOM(read('tools/templates/'+source),{url:origin+sourcePath,runScripts:'outside-only'});
  const doc=dom.window.document;
  doc.documentElement.lang=lang;doc.documentElement.dataset.staticLang=lang;
  if(lang==='en')doc.documentElement.dataset.localeBase=projectPath(id);
  familyRows(doc,id);translate(doc,id,lang,kind);familyLinks(doc,lang);
  if(kind==='index'&&id!=='video-glow'){
    const demo=doc.querySelector(id==='uni-homebot'?'.hero .phone':'.hero .demo, .screen .demo, .demo');
    if(demo)demo.id='demo';
  }
  const url=origin+pagePath(id,lang,kind);
  const brand=id==='hub'?'vKardin':id==='uni-homebot'?'UNI':id==='video-glow'?'Video Glow':id==='video-drift'?'Video Drift':id==='leveler'?'Leveler':id==='tukk'?'Tukk':'Snapt';
  const sub={ru:{support:'Поддержка',privacy:'Политика конфиденциальности'},uk:{support:'Підтримка',privacy:'Політика конфіденційності'},en:{support:'Support',privacy:'Privacy policy'}};
  const [mainTitle,h1,mainDesc]=copy[id][lang];
  const title=kind==='index'?mainTitle:`${brand} — ${sub[lang][kind]}`;
  const description=kind==='index'?mainDesc:kind==='support'?
    {ru:`Поддержка ${brand}: ответы на вопросы, помощь с настройкой, сообщения об ошибках и предложения по улучшению.`,uk:`Підтримка ${brand}: відповіді на запитання, допомога з налаштуванням, повідомлення про помилки й пропозиції.`,en:`${brand} support: answers, setup help, bug reports and suggestions for improvements.`}[lang]:
    {ru:`Политика конфиденциальности ${brand}: обработка данных, локальное хранение и контакты автора.`,uk:`Політика конфіденційності ${brand}: обробка даних, локальне зберігання й контакти автора.`,en:`${brand} privacy policy: data processing, local storage and author contact information.`}[lang];
  doc.title=title;
  const heading=doc.querySelector('h1');if(kind==='index'){heading.textContent=h1;heading.removeAttribute('data-i18n');}
  doc.querySelectorAll('meta[name="description"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang],script[type="application/ld+json"]').forEach(e=>e.remove());
  const meta=(key,value,property=false)=>{const e=doc.createElement('meta');e.setAttribute(property?'property':'name',key);e.content=value;doc.head.append(e);};
  meta('description',description);meta('og:type','website',true);meta('og:title',title,true);meta('og:description',description,true);meta('og:url',url,true);
  meta('og:locale',{ru:'ru_RU',uk:'uk_UA',en:'en_US'}[lang],true);
  let image=id==='snapt'?'/snapt/social-preview.png':id==='uni-homebot'?'/uni-homebot/assets/banner.jpg':id==='leveler'?'/leveler/img/og.png':`/media/og/${id}-${lang}.png`;
  meta('og:site_name','vKardin',true);meta('og:image',origin+image,true);meta('og:image:width',String(ogSize(image)[0]),true);meta('og:image:height',String(ogSize(image)[1]),true);meta('og:image:alt',title,true);meta('twitter:card','summary_large_image');meta('twitter:title',title);meta('twitter:description',description);meta('twitter:image',origin+image);
  doc.querySelectorAll('link[rel="apple-touch-icon"]').forEach(e=>e.remove());
  const touch=doc.createElement('link');touch.rel='apple-touch-icon';touch.href=id==='hub'?'/apple-touch-icon.png':`/family-assets/touch/${id}.png`;doc.head.append(touch);
  const canonical=doc.createElement('link');canonical.rel='canonical';canonical.href=url;doc.head.append(canonical);
  for(const l of [...langs,'x-default']){const e=doc.createElement('link');e.rel='alternate';e.hreflang=l;e.href=origin+pagePath(id,l==='x-default'?'en':l,kind);doc.head.append(e);}
  // Real language links also work with JavaScript disabled.
  doc.querySelectorAll('[data-lang]').forEach(b=>{const a=doc.createElement('a');a.href=pagePath(id,b.dataset.lang,kind);a.hreflang=b.dataset.lang;a.textContent=b.textContent;if(b.dataset.lang===lang)a.setAttribute('aria-current','page');b.replaceWith(a);});
  doc.querySelectorAll('.langs a[hreflang]').forEach(a=>{a.setAttribute('href',pagePath(id,a.hreflang,kind));a.removeAttribute('aria-current');if(a.hreflang===lang)a.setAttribute('aria-current','page');});
  for(const selector of ['.langs','.hub-languages']){
    const switcher=doc.querySelector(selector);if(!switcher)continue;
    for(const l of langs){const a=switcher.querySelector(`a[hreflang="${l}"]`);if(a)switcher.append(a);}
  }
  for(const el of doc.querySelectorAll('[src],[href],[data-qr]'))for(const attr of ['src','href','data-qr']) {
    // Search metadata requires absolute URLs; normalize only local resources and UI links.
    if(el.matches('link[rel="canonical"],link[rel="alternate"][hreflang]'))continue;
    const v=el.getAttribute(attr);if(!v||v.startsWith('#')||/^(?:data:|mailto:|tel:|javascript:)/i.test(v))continue;
    const target=new URL(v,origin+sourcePath);if(target.origin!==origin)continue;
    if(el.tagName==='SCRIPT'&&attr==='src')target.searchParams.set('v','seo-3');
    // Localize cross-project navigation, cards and document links.
    const match=target.pathname.match(/^\/(video-glow|leveler|video-drift|snapt|uni-homebot|koly|tukk)\/(?:ru\/|uk\/|en\/)?(?:(index|support|privacy)\.html)?$/);
    if(attr==='href'&&el.tagName==='A'&&!el.hreflang) {
      if(match)target.pathname=pagePath(match[1],lang,match[2]||'index');
      else if(target.pathname==='/')target.pathname=pagePath('hub',lang);
    }
    el.setAttribute(attr,target.pathname+target.search+target.hash);
  }
  // Card donations through Ko-fi and Donatello, placed above the crypto wallets.
  const wallets=doc.querySelector('#donate #wallets');
  if(wallets){
    const row=doc.createElement('p');row.className='kofi-row';
    const a=doc.createElement('a');a.className='kofi';a.href='https://ko-fi.com/vkardin';a.target='_blank';a.rel='noopener';
    a.textContent={en:'Donate by card on Ko-fi ↗',ru:'Поддержать картой через Ko-fi ↗',uk:'Підтримати карткою через Ko-fi ↗'}[lang];
    const d=doc.createElement('a');d.className='kofi kofi-alt';d.href='https://donatello.to/vkardin';d.target='_blank';d.rel='noopener';
    d.textContent={en:'Donate via Donatello ↗',ru:'Поддержать через Donatello ↗',uk:'Підтримати через Donatello ↗'}[lang];
    row.append(a,' ',d);wallets.before(row);
  }
  // Remove the old automatic language redirect; URLs select the language.
  doc.querySelectorAll('script:not([src])').forEach(s=>{if(s.textContent.includes('location.replace')&&id==='snapt')s.remove();});
  doc.querySelectorAll('img[data-shot]').forEach(img=>{
    const shot=img.dataset.shot;img.src=`/${id}/img/${shot}-${lang}.webp`;
    img.alt=captions[lang][['glow','led','room','settings'].indexOf(shot)]||`${brand} — ${shot}`;
    if(shot==='glow')img.setAttribute('fetchpriority','high');
  });
  doc.querySelectorAll('img[src]').forEach(img=>{
    const source=new URL(img.src),candidate=responsive.get(source.pathname);
    if(!candidate)return;
    const width=source.pathname.startsWith('/video-glow/img/')?640:480;
    img.srcset=`${candidate.small} ${width}w, ${source.pathname} ${candidate.width}w`;
    img.sizes=source.pathname.startsWith('/video-glow/img/')?'(max-width: 700px) calc(100vw - 36px), 960px':'(max-width: 700px) calc(100vw - 36px), 540px';
    img.decoding='async';
  });
  if(!doc.querySelector('main')){
    const main=doc.createElement('main');
    const header=doc.querySelector('header.top');const footer=doc.querySelector('footer');
    if(header&&footer){header.after(main);while(main.nextSibling&&main.nextSibling!==footer)main.append(main.nextSibling);}
    else throw Error('No main landmark: '+url);
  }
  const main=doc.querySelector('main');
  // Include the Snapt hero in its main landmark.
  if(id==='snapt'){const hero=doc.querySelector('body>.hero');if(hero)main.prepend(hero);}
  doc.querySelectorAll('[id="family-content"]').forEach(e=>{if(e!==main)e.removeAttribute('id');});main.id='family-content';main.tabIndex=-1;
  const author={'@type':'Person',name:'vKardin',url:origin+'/',sameAs:['https://github.com/vkardin','https://www.youtube.com/@vKardin','https://www.tiktok.com/@vkard1n']};
  const schema=kind==='index'&&id!=='hub'?{'@context':'https://schema.org','@type':'SoftwareApplication',name:brand,url,inLanguage:lang,description,applicationCategory:['uni-homebot','tukk'].includes(id)?'UtilitiesApplication':'MultimediaApplication',operatingSystem:id==='snapt'?'Windows, macOS, Linux':id==='uni-homebot'?'Linux':id==='tukk'?'Android 8.0+':'Chrome, Firefox',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},isAccessibleForFree:true,license:'https://opensource.org/licenses/MIT',image:origin+image,downloadUrl:stores[id]?.[0]||(id==='tukk'?'https://github.com/vkardin/tukk':`https://github.com/vkardin/${repos[id]}/releases/latest`),sameAs:[...(stores[id]||[]),`https://github.com/vkardin/${repos[id]}`],author}:
    {'@context':'https://schema.org','@type':id==='hub'?'CollectionPage':'WebPage',name:title,url,inLanguage:lang,description,...(id==='hub'?{author,mainEntity:{'@type':'ItemList',itemListElement:Object.keys(repos).map((p,i)=>({'@type':'ListItem',position:i+1,url:origin+pagePath(p,lang)}))}}:{})};
  const json=doc.createElement('script');json.type='application/ld+json';json.textContent=JSON.stringify(schema).replaceAll('<','\\u003c');doc.head.append(json);
  // Styles cover static language links and stable screenshots before the first paint.
  const css=doc.createElement('link');css.rel='stylesheet';css.href='/seo.css?v=5';doc.head.append(css);
  const dest=pagePath(id,lang,kind)+(kind==='index'?'index.html':'');
  write(dest.slice(1),dom.serialize().replace(/^[\t ]+$/gm,'')+'\n');urls.push(url);dom.window.close();
}
for(const id of Object.keys(copy))for(const lang of langs){render(id,lang,'index');if(['video-glow','leveler','video-drift'].includes(id))for(const kind of ['support','privacy'])render(id,lang,kind);}
// Keep already published /en/ links working without duplicate English pages.
for(const id of Object.keys(copy).filter(id=>!perLanguage.has(id)))for(const kind of ['index',...(['video-glow','leveler','video-drift'].includes(id)?['support','privacy']:[])]){
  const destination=pagePath(id,'en',kind),legacy=projectPath(id)+'en/'+(kind==='index'?'index.html':kind+'.html');
  const script=`try{localStorage.setItem('vkardin-site-language-choice','en');}catch{}location.replace(${JSON.stringify(destination)}+location.search+location.hash);`;
  write(legacy.slice(1),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Page moved</title><link rel="canonical" href="'+origin+destination+'"><meta http-equiv="refresh" content="0;url='+destination+'"><script>'+script+'</script></head><body><a href="'+destination+'">Continue in English</a></body></html>\n');
}
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>`  <url><loc>${url}</loc></url>`).join('\n')+'\n</urlset>\n');
write('robots.txt','User-agent: *\nAllow: /\nDisallow: /tools/\nDisallow: /node_modules/\n\nSitemap: '+origin+'/sitemap.xml\n');
console.log(`Generated ${urls.length} localized pages and sitemap.xml.`);

document.documentElement.dataset.theme = 'dark';
// Apply saved appearance before the first paint.
try {
  const p = JSON.parse(localStorage.getItem('vkardin-site-preferences') || '{}') || {};
  document.documentElement.dataset.theme = 'dark';
  document.documentElement.dataset.motion = p.motion === 'reduce' ? 'reduce' : 'auto';
} catch {}

// English is the static default. Only entry URLs negotiate a supported language;
// explicit /ru/ and /uk/ pages always keep their own language.
function siteLanguage(preferences, explicit, saved) {
 const supported=['en','ru','uk'];
 if(supported.includes(explicit))return explicit;
 if(supported.includes(saved))return saved;
 for(const preference of preferences){
  const code=String(preference).toLowerCase().split(/[-_]/)[0];
  if(supported.includes(code))return code;
 }
 return 'en';
}
(() => {
 const base=document.documentElement.dataset.localeBase;
 if(!base)return;
 let saved;try{saved=localStorage.getItem('vkardin-site-language-choice');}catch{}
 const explicit=new URLSearchParams(location.search).get('lang');
 const language=siteLanguage(navigator.languages||[navigator.language||'en'],explicit,saved);
 if(language==='en')return;
 const suffix=location.pathname.slice(base.length).replace(/^index\.html$/,'');
 if(suffix.includes('/'))return;
 const query=new URLSearchParams(location.search);query.delete('lang');
 location.replace(base+language+'/'+suffix+(query.size?'?'+query:'')+location.hash);
})();

// One language preference for the project websites.
try {
 const language=document.documentElement.lang||'ru';
 for(const key of ['vg-lang','lv-lang','video-drift-lang','lang'])localStorage.setItem(key,language);
 if(['uni-homebot','hub'].includes(document.documentElement.dataset.siteProject))document.documentElement.lang=language;
} catch {}

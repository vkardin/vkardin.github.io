// Localised links and project descriptions; no external requests or tracking.
(() => {
  const words = {"ru":{"title":"Другие мои программы","sub":"Их делает один человек. Все бесплатные и с открытым кодом.","site":"Открыть сайт","code":"Исходный код","download":"Релизы","nav":"Проекты","author":"Бесплатно и с открытым кодом","skip":"Перейти к содержимому","install":"Установить в Chrome","firefox":"Установить в Firefox","wip":"ещё в работе"},"uk":{"title":"Інші мої програми","sub":"Їх робить одна людина. Усі безкоштовні й з відкритим кодом.","site":"Відкрити сайт","code":"Вихідний код","download":"Релізи","nav":"Проєкти","author":"Безкоштовно й з відкритим кодом","skip":"Перейти до вмісту","install":"Встановити в Chrome","firefox":"Встановити у Firefox","wip":"ще в роботі"},"en":{"title":"More of my programs","sub":"All made by one person. Free and open source.","site":"Visit website","code":"Source code","download":"Releases","nav":"Projects","author":"Free and open source","skip":"Skip to content","install":"Add to Chrome","firefox":"Install in Firefox","wip":"in the works"}};
  const projects = {"video-glow":{"type":{"ru":"Расширение для браузера","uk":"Розширення для браузера","en":"Browser extension"},"desc":{"ru":"Мягкий свет вокруг видео в цвет кадра, как подсветка за телевизором.","uk":"М’яке світло навколо відео в колір кадру, як підсвітка за телевізором.","en":"Soft light around the video that follows the picture, like a backlight behind a TV."}},"leveler":{"type":{"ru":"Расширение для браузера","uk":"Розширення для браузера","en":"Browser extension"},"desc":{"ru":"Выравнивает громкость в фильмах: диалоги слышно, взрывы не оглушают.","uk":"Вирівнює гучність у фільмах: діалоги чути, вибухи не глушать.","en":"Evens out the volume in films: you can hear the dialogue and the explosions don’t blast."}},"video-drift":{"type":{"ru":"Расширение для браузера","uk":"Розширення для браузера","en":"Browser extension"},"desc":{"ru":"Видео в отдельном окошке поверх остальных. Помнит, где вы остановились.","uk":"Відео в окремому віконці поверх інших. Пам’ятає, де ви зупинилися.","en":"Video in a small window on top of everything else. Remembers where you stopped."}},"snapt":{"type":{"ru":"Программа и расширение","uk":"Програма й розширення","en":"App and extension"},"desc":{"ru":"Скриншот одной клавишей, стрелки и подписи сразу поверх снимка.","uk":"Скриншот однією клавішею, стрілки й підписи одразу поверх знімка.","en":"A screenshot with one key, then arrows and captions right on top of it."}},"uni-homebot":{"type":{"ru":"Бот в Telegram","uk":"Бот у Telegram","en":"Telegram bot"},"desc":{"ru":"Домашний сервер под рукой: приложения, мониторинг и уведомления.","uk":"Домашній сервер під рукою: застосунки, моніторинг і сповіщення.","en":"Your home server at hand: apps, monitoring and notifications."}},"koly":{"type":{"ru":"Виджет для Windows","uk":"Віджет для Windows","en":"Windows widget"},"desc":{"ru":"Графики отключений света по всем областям Украины и отсчёт до включения.","uk":"Графіки відключень світла по всіх областях України й відлік до ввімкнення.","en":"Power outage schedules for every region of Ukraine, with a countdown until the power is back."}},"tukk":{"type":{"ru":"Приложение для Android","uk":"Застосунок для Android","en":"Android app"},"desc":{"ru":"Встряхнуть телефон, чтобы включить фонарик. Перевернуть, чтобы стало тихо.","uk":"Струснути телефон, щоб увімкнути ліхтарик. Перевернути, щоб стало тихо.","en":"Shake the phone to turn on the flashlight. Flip it over for silence."}}};
  let previous = '';
  function apply() {
    const code = document.documentElement.lang.slice(0,2), lang = words[code] ? code : 'en';
    if (lang === previous) return; previous = lang;
    document.querySelectorAll('.family-preview').forEach(link => { const id = new URL(link.href).pathname.split('/')[1]; const img = link.querySelector('img'); if (img && projects[id]) img.src = 'https://vkardin.github.io/media/' + id + '-' + lang + '.webp?v=7'; });
    document.querySelectorAll('[data-family-word]').forEach((el) => { el.textContent = words[lang][el.dataset.familyWord]; });
    document.querySelectorAll('[data-family-type]').forEach((el) => { el.textContent = projects[el.dataset.familyType].type[lang]; });
    document.querySelectorAll('[data-family-description]').forEach((el) => { el.textContent = projects[el.dataset.familyDescription].desc[lang]; });
    document.querySelectorAll('[data-family-site]').forEach((el) => { const id = el.dataset.familySite; el.href = 'https://vkardin.github.io/' + id + '/' + (lang !== 'en' ? lang + '/' : ''); });
  }
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  apply();
})();

// Shared site preferences on vkardin.github.io.
(() => {
  const key = 'vkardin-site-preferences';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  function apply() {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.motion = prefs.motion === 'reduce' ? 'reduce' : 'auto';
  }
  apply();
  const nav = document.querySelector('.family-nav-inner');
  if (!nav) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'family-settings-button'; button.textContent = '⚙';
  const dialog = document.createElement('dialog'); dialog.className = 'family-settings-dialog';
  dialog.innerHTML = '<form method="dialog"><div class="family-settings-heading"><h2 id="family-settings-title"></h2><button class="family-close" value="close">×</button></div><label><span data-pref-label="motion"></span><select name="motion"><option value="auto"></option><option value="reduce"></option></select></label><p></p></form>';
  dialog.setAttribute('aria-labelledby','family-settings-title');
  document.body.append(dialog); nav.append(button);
  const motion = dialog.querySelector('[name=motion]');
  motion.value = prefs.motion === 'reduce' ? 'reduce' : 'auto';
  const copy = {
    ru:['Настройки сайта','','Анимация','','','','Как в системе','Уменьшить','Общие настройки для всех сайтов vkardin в этом браузере.','Закрыть'],
    uk:['Налаштування сайту','','Анімація','','','','Як у системі','Зменшити','Спільні налаштування всіх сайтів vkardin у цьому браузері.','Закрити'],
    en:['Site settings','','Motion','','','','System','Reduce','Shared preferences for all vkardin sites in this browser.','Close']
  };
  function localize(){
    const t=copy[document.documentElement.lang.slice(0,2)] || copy.en;
    button.setAttribute('aria-label',t[0]); button.title=t[0];
    dialog.querySelector('h2').textContent=t[0];
    dialog.querySelector('[data-pref-label=motion]').textContent=t[2];
    [...motion.options].forEach((o,i)=>o.textContent=t[6+i]);
    dialog.querySelector('p').textContent=t[8]; dialog.querySelector('.family-close').setAttribute('aria-label',t[9]);
  }
  localize(); new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  button.addEventListener('click',()=>dialog.showModal());
  dialog.addEventListener('change',()=>{prefs={theme:'dark',motion:motion.value};apply();try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}});
  addEventListener('storage',(event)=>{if(event.key!==key)return;try{prefs=JSON.parse(event.newValue||'{}')||{};}catch{prefs={};}apply();motion.value=prefs.motion||'auto';});
})();

(() => {
const tags={"en": {"video-glow": ["Ambient light", "LED", "Room colour"], "leveler": ["Loudness", "EQ", "Speed"], "video-drift": ["Floating video", "Subtitles", "Notes"], "snapt": ["Capture", "Annotate", "Export"], "uni-homebot": ["Telegram", "Monitoring", "Self-hosted"], "koly": ["Outages", "Countdown", "Offline"], "tukk": ["Gestures", "Flashlight", "Private"]}, "ru": {"video-glow": ["Подсветка", "LED", "Цвет комнаты"], "leveler": ["Громкость", "Эквалайзер", "Скорость"], "video-drift": ["Плавающее видео", "Субтитры", "Заметки"], "snapt": ["Снимай", "Размечай", "Сохраняй"], "uni-homebot": ["Telegram", "Мониторинг", "Свой сервер"], "koly": ["Отключения", "Обратный отсчёт", "Офлайн"], "tukk": ["Жесты", "Фонарик", "Приватно"]}, "uk": {"video-glow": ["Підсвічування", "LED", "Колір кімнати"], "leveler": ["Гучність", "Еквалайзер", "Швидкість"], "video-drift": ["Плаваюче відео", "Субтитри", "Нотатки"], "snapt": ["Знімай", "Позначай", "Зберігай"], "uni-homebot": ["Telegram", "Моніторинг", "Свій сервер"], "koly": ["Відключення", "Зворотний відлік", "Офлайн"], "tukk": ["Жести", "Ліхтарик", "Приватно"]}};
function applyTags(){const lang=document.documentElement.lang.slice(0,2);document.querySelectorAll('[data-family-chip]').forEach(el=>{const [id,index]=el.dataset.familyChip.split(':');el.textContent=(tags[lang]||tags.en)[id][Number(index)];});}
new MutationObserver(applyTags).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});applyTags();
})();

(() => {
 const labels={ru:{try:'Попробовать',features:'Возможности',install:'Установить',download:'Скачать',donate:'Поддержать',support:'Поддержка',code:'GitHub'},uk:{try:'Спробувати',features:'Можливості',install:'Встановити',download:'Завантажити',donate:'Підтримати',support:'Підтримка',code:'GitHub'},en:{try:'Try it',features:'Features',install:'Install',download:'Download',donate:'Donate',support:'Support',code:'GitHub'}};
 function applyLanguage(){
  const lang=['ru','uk','en'].includes(document.documentElement.lang)?document.documentElement.lang:'ru';
  document.querySelectorAll('[data-family-label]').forEach(el=>el.textContent=labels[lang][el.dataset.familyLabel]);
  document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
  try{localStorage.setItem('vkardin-site-language',lang);for(const k of ['vg-lang','lv-lang','video-drift-lang','lang'])localStorage.setItem(k,lang);}catch{}
 }
 document.addEventListener('click',event=>{const link=event.target.closest('a[hreflang]');if(link&&['en','ru','uk'].includes(link.hreflang)){try{localStorage.setItem('vkardin-site-language',link.hreflang);localStorage.setItem('vkardin-site-language-choice',link.hreflang);}catch{if(link.hreflang==='en'){const url=new URL(link.href);url.searchParams.set('lang','en');link.href=url.href;}}}},true);
 new MutationObserver(applyLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 applyLanguage();
})();

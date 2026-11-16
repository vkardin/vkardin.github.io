// Demo: the small panel of the program. The switch, the kind of work and the
// power bank change the draw and the time left the way the program counts them.
(() => {
  const demo = document.querySelector('.demo');
  if (!demo) return;
  const sw = demo.querySelector('.switch'), bank = demo.querySelector('.with-bank');
  const draw = demo.querySelector('.v-draw'), lasts = demo.querySelector('.v-lasts');
  const title = demo.querySelector('.p-title'), sub = demo.querySelector('.p-sub'), result = demo.querySelector('.result');
  // Watts without saving and with it: rounded numbers from the author's laptop.
  const watts = {work: [38, 14], film: [34, 20], game: [60, 33]};
  const batteryWh = 47, bankWh = 120;
  const d = demo.dataset;
  const span = hours => {
    const m = Math.round(hours * 60), h = Math.floor(m / 60);
    return (h ? h + ' ' + d.h + ' ' : '') + (m % 60) + ' ' + d.min;
  };
  function show(say) {
    const on = d.mode === 'on', [usual, saving] = watts[d.profile] || watts.work;
    const w = on ? saving : usual, wh = batteryWh + (d.bank === 'on' ? bankWh : 0);
    draw.textContent = w;
    lasts.textContent = span(wh / w);
    title.textContent = on ? d.on : d.off;
    sub.textContent = on ? d.since : d.plug;
    sw.setAttribute('aria-checked', String(on));
    if (say) result.textContent = on
      ? d.resOn.replace('{a}', usual).replace('{b}', saving).replace('{x}', (Math.round(usual / saving * 10) / 10).toLocaleString(document.documentElement.lang || 'en'))
      : d.resOff.replace('{a}', usual);
  }
  sw.addEventListener('click', () => { d.mode = d.mode === 'on' ? 'off' : 'on'; show(true); });
  demo.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
    d.profile = chip.dataset.profile;
    demo.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    show(true);
  }));
  bank.addEventListener('change', () => { d.bank = bank.checked ? 'on' : 'off'; show(true); });
  show(false);
})();

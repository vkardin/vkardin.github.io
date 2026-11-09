// Gesture demo: each button plays its motion once and toggles the action it stands for.
(() => {
  const demo = document.querySelector('.demo');
  if (!demo) return;
  const phone = demo.querySelector('.phone');
  const toast = demo.querySelector('.toast');
  const result = demo.querySelector('.result');
  const clock = demo.querySelector('.clock');
  const keys = {shake: 'torch', tap: 'music', flip: 'silent', chop: 'sos'};
  const active = {torch: 'on', music: 'paused', silent: 'on', sos: 'on'};
  const media = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
  const reduced = () => media.matches || document.documentElement.dataset.motion === 'reduce';
  let hide;

  function tick() {
    const now = new Date();
    if (clock) clock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }
  tick();
  setInterval(tick, 30000);

  demo.querySelectorAll('.gesture').forEach(button => {
    button.addEventListener('click', () => {
      const gesture = button.dataset.gesture, key = keys[gesture];
      const on = demo.dataset[key] !== active[key];
      if (on) demo.dataset[key] = active[key]; else delete demo.dataset[key];
      // The SOS signal and the flashlight share the same light.
      if (key === 'sos' && on) { delete demo.dataset.torch; demo.querySelector('[data-gesture="shake"]').setAttribute('aria-pressed', 'false'); }
      if (key === 'torch' && on) { delete demo.dataset.sos; demo.querySelector('[data-gesture="chop"]').setAttribute('aria-pressed', 'false'); }
      button.setAttribute('aria-pressed', String(on));
      const message = on ? button.dataset.on : button.dataset.off;
      result.textContent = button.textContent + ': ' + message;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(hide);
      hide = setTimeout(() => toast.classList.remove('show'), 1800);
      if (!reduced() && phone) {
        phone.className = 'phone';
        void phone.offsetWidth;
        phone.classList.add('do-' + gesture);
      }
    });
  });
  phone?.addEventListener('animationend', event => { if (event.target === phone || event.target.classList.contains('r2')) phone.className = 'phone'; });
})();

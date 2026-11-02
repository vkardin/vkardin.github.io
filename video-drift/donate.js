// Wallets (Trust Wallet). QR codes live in qr/<id>.svg.
const WALLETS = [
  { id: 'usdt-trc20', name: 'USDT', net: 'TRON · TRC-20', color: '#26a17b', sign: '₮', addr: 'TWW4iFFTPtvDBu3NH2iy6WFKQZgkq3TRhN' },
  { id: 'btc', name: 'Bitcoin', net: 'BTC', color: '#f7931a', sign: '₿', addr: 'bc1qk2eu8d53x08p0m6k3z5ernv55v2clr4ywarp7w' },
  { id: 'eth', name: 'Ethereum', net: 'ETH · ERC-20', color: '#627eea', sign: 'Ξ', addr: '0x3D0765a406dD7AEDF9614bB3742A9084dfF42f18' },
  { id: 'sol', name: 'Solana', net: 'SOL', color: '#9945ff', sign: 'S', addr: 'G1iMvFiS6yzTouDnZcaFHimkdicNmTtuxhYjZW1UTpPE' }
];
const COPY_EN = { copy: 'Copy address', copied: 'Copied' };
const copyText = (k) => ((window.I18N[document.documentElement.lang] || {})[k]) || COPY_EN[k];

function renderWallets() {
  const box = document.getElementById('wallets');
  const tpl = document.getElementById('wallet');
  if (!box || !tpl) return;
  for (const w of WALLETS) {
    const n = tpl.content.cloneNode(true);
    const i = n.querySelector('.coin i');
    i.textContent = w.sign; i.style.background = w.color;
    n.querySelector('.coin b').textContent = w.name;
    n.querySelector('.coin small').textContent = w.net;
    n.querySelector('.qr img').src = `qr/${w.id}.svg`;
    n.querySelector('.qr img').alt = `QR ${w.name}`;
    n.querySelector('.addr').textContent = w.addr;
    const btn = n.querySelector('.copy');
    btn.textContent = copyText('copy');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(w.addr); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(btn.previousElementSibling);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy');
      }
      btn.classList.add('done'); btn.textContent = copyText('copied');
      setTimeout(() => { btn.classList.remove('done'); btn.textContent = copyText('copy'); }, 1800);
    });
    box.appendChild(n);
  }
}
renderWallets();
// Keep button labels in sync with the language switcher.
document.querySelectorAll('.langs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.copy').forEach((c) => { if (!c.classList.contains('done')) c.textContent = copyText('copy'); });
}));

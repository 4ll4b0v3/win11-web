/* Browser - an iframe with an address bar. Many sites refuse to be framed (X-Frame-Options); that's a web limitation. */
(function () {
  'use strict';
  const { h } = W11;

  const homeDoc = `<!doctype html><meta charset="utf-8"><style>
    body{font-family:Segoe UI,system-ui,sans-serif;margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#e0f2fe,#ede9fe);color:#1f2937}
    h1{font-weight:600;margin:0 0 6px}p{color:#6b7280;margin:0 0 22px}
    .links{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:480px}
    a{padding:10px 16px;border-radius:8px;background:#fff;color:#0a64d6;text-decoration:none;box-shadow:0 1px 4px rgba(0,0,0,.12)}
    a:hover{background:#f3f4f6}small{margin-top:26px;color:#9ca3af;max-width:420px;text-align:center}
  </style><h1>Browser</h1><p>Type an address or a search above.</p>
  <div class="links"><a href="https://en.wikipedia.org/wiki/Special:Random">Wikipedia</a><a href="https://example.com">example.com</a>
  <a href="https://developer.mozilla.org/">MDN</a><a href="https://www.openstreetmap.org/">OpenStreetMap</a></div>
  <small>Some sites block being shown inside other pages. Use the "open in new tab" button if a page stays blank.</small>`;

  function toUrl(v) {
    v = v.trim();
    if (!v) return null;
    if (v === 'about:home') return 'about:home';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && !/\s/.test(v)) return 'https://' + v;
    return 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(v);
  }

  W11.registerApp({
    id: 'browser', name: 'Browser', icon: 'browser', w: 900, h: 560,
    create(win) {
      let cur = 'about:home';
      const frame = h('iframe', { class: 'br-frame', sandbox: 'allow-scripts allow-forms allow-same-origin allow-popups', referrerpolicy: 'no-referrer' });
      const addr = h('input', { class: 'input br-addr', placeholder: 'Search or enter web address', spellcheck: 'false' });
      function go(v) {
        const u = toUrl(v); if (!u) return;
        cur = u; addr.value = u === 'about:home' ? '' : u;
        if (u === 'about:home') { frame.removeAttribute('src'); frame.srcdoc = homeDoc; win.setTitle('New tab - Browser'); }
        else { frame.removeAttribute('srcdoc'); frame.src = u; win.setTitle(u.replace(/^https?:\/\//, '').slice(0, 40) + ' - Browser'); }
      }
      addr.addEventListener('keydown', e => { if (e.key === 'Enter') go(addr.value); });
      win.body.append(h('div', { class: 'browser' },
        h('div', { class: 'ex-toolbar' },
          h('button', { class: 'tbtn', title: 'Home', html: Icons.win, onclick: () => go('about:home') }),
          h('button', { class: 'tbtn', title: 'Reload', html: Icons.reload, onclick: () => go(cur) }),
          addr,
          h('button', { class: 'btn', onclick: () => cur !== 'about:home' && window.open(cur, '_blank', 'noopener') }, 'Open in new tab')),
        frame));
      go('about:home');
    }
  });
})();

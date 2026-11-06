/* shell.js - desktop, taskbar, Start menu, flyouts, lock screen */
(function () {
  'use strict';
  const { $, $$, h, bus, settings, menu, ui } = W11;

  const pinnedIds = ['explorer', 'browser', 'notepad', 'calculator', 'terminal', 'paint', 'settings'];
  const taskbarIds = ['explorer', 'browser', 'notepad', 'terminal', 'settings'];
  const closeFlyouts = except => $$('.flyout').forEach(f => { if (f !== except) f.classList.add('hidden'); });
  const toggleFlyout = el => { const open = el.classList.contains('hidden'); closeFlyouts(el); el.classList.toggle('hidden', !open); return open; };

  /* ---------- clock ---------- */
  function tick() {
    const d = new Date();
    $('#clock-t').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#clock-d').textContent = d.toLocaleDateString();
    $('#lock-time').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#lock-date').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  /* ---------- desktop icons ---------- */
  function renderIcons() {
    const box = $('#icons');
    const items = [
      { label: 'This PC', icon: 'computer', open: () => W11.openApp('explorer', { path: '/' }) },
      { label: 'Recycle Bin', icon: 'trash', open: () => ui.alert('Recycle Bin', 'Deleted files are removed permanently in this demo.') },
      { label: 'Browser', icon: 'browser', open: () => W11.openApp('browser') },
      { label: 'Terminal', icon: 'terminal', open: () => W11.openApp('terminal') },
      ...FS.list('/Desktop').map(f => ({ label: f.name, icon: f.type === 'dir' ? 'folder' : 'file', open: () => window.openPath(f.path) }))
    ];
    box.replaceChildren(...items.map(it => {
      const el = h('button', { class: 'dicon', ondblclick: it.open,
        onclick: e => { e.stopPropagation(); $$('.dicon.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); },
        onkeydown: e => { if (e.key === 'Enter') it.open(); } },
        h('span', { class: 'di', html: Icons[it.icon] }), h('span', { class: 'dl' }, it.label));
      return el;
    }));
  }

  /* ---------- taskbar ---------- */
  function renderTaskbar() {
    const c = $('#tb-center');
    const ids = [...taskbarIds];
    W11.wins.forEach(w => { if (!ids.includes(w.app.id)) ids.push(w.app.id); });
    const startBtn = h('button', { class: 'tb-btn', title: 'Start', html: Icons.start, onclick: e => { e.stopPropagation(); openStart(!$('#startmenu').classList.contains('hidden') ? false : true); } });
    const searchBtn = h('button', { class: 'tb-btn tb-search', title: 'Search', html: Icons.search, onclick: e => { e.stopPropagation(); openStart(true); } });
    const apps = ids.map(id => {
      const app = W11.Apps[id]; const ws = W11.wins.filter(w => w.app.id === id);
      const top = ws.slice().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
      const active = ws.some(w => w.el.classList.contains('active') && !w.el.classList.contains('minimized'));
      return h('button', {
        class: 'tb-btn' + (ws.length ? ' running' : '') + (active ? ' active' : ''), title: app.name, html: Icons[app.icon],
        onclick: e => {
          e.stopPropagation(); closeFlyouts();
          if (!ws.length) return W11.openApp(id);
          if (active) ws.forEach(w => W11.minimize(w)); else W11.focus(top);
        },
        oncontextmenu: e => { e.preventDefault(); menu(e.clientX, e.clientY - 70, [{ label: 'New window', action: () => { closeFlyouts(); W11.openApp(id); } }, ...(ws.length ? [{ label: 'Close all windows', action: () => ws.forEach(w => w.close()) }] : [])]); }
      });
    });
    c.replaceChildren(startBtn, searchBtn, ...apps);
  }

  /* ---------- Start menu ---------- */
  const start = () => $('#startmenu');
  function openStart(open) {
    closeFlyouts(open ? start() : null);
    start().classList.toggle('hidden', !open);
    if (open) { const s = $('#start-search'); s.value = ''; searchStart(''); setTimeout(() => s.focus(), 30); renderRecent(); }
  }
  function renderPinned() {
    $('#pinned').replaceChildren(...pinnedIds.map(id => {
      const a = W11.Apps[id];
      return h('button', { class: 'pin', onclick: () => { openStart(false); W11.openApp(id); } }, h('span', { class: 'pi', html: Icons[a.icon] }), a.name);
    }));
  }
  function renderRecent() {
    const files = [];
    (function walk(p, d) { FS.list(p).forEach(i => { if (i.type === 'dir') { if (d < 2) walk(i.path, d + 1); } else files.push(i); }); })('/', 0);
    const el = $('#recent');
    el.replaceChildren(...(files.length ? files.slice(0, 6) : []).map(f =>
      h('button', { class: 'rec', onclick: () => { openStart(false); window.openPath(f.path); } }, h('span', { class: 'ri', html: Icons.file }),
        h('span', {}, h('div', {}, f.name), h('div', { class: 'st-d' }, f.path)))));
    if (!files.length) el.append(h('div', { class: 'st-d', style: { padding: '8px 4px' } }, 'No files yet. Create some in File Explorer.'));
  }
  function searchStart(q) {
    q = q.trim().toLowerCase();
    $('#start-body').classList.toggle('hidden', !!q);
    const res = $('#start-results'); res.classList.toggle('hidden', !q);
    if (!q) return;
    const apps = Object.values(W11.Apps).filter(a => a.name.toLowerCase().includes(q)).map(a => ({ label: a.name, sub: 'App', icon: a.icon, run: () => W11.openApp(a.id) }));
    const files = [];
    (function walk(p) { FS.list(p).forEach(i => { if (i.name.toLowerCase().includes(q)) files.push({ label: i.name, sub: i.path, icon: i.type === 'dir' ? 'folder' : 'file', run: () => window.openPath(i.path) }); if (i.type === 'dir') walk(i.path); }); })('/');
    const all = [...apps, ...files].slice(0, 9);
    res.replaceChildren(...(all.length ? all.map(r => h('button', { class: 'rec', onclick: () => { openStart(false); r.run(); } },
      h('span', { class: 'ri', html: Icons[r.icon] }), h('span', {}, h('div', {}, r.label), h('div', { class: 'st-d' }, r.sub)))) : [h('div', { class: 'st-d', style: { padding: '14px' } }, 'No results for "' + q + '"')]));
    res.dataset.first = all.length ? '1' : '';
    res._first = all[0];
  }

  /* ---------- power ---------- */
  function powerMenu(x, y) {
    menu(x, y, [
      { label: 'Lock', action: () => { openStart(false); lock(); } },
      { label: 'Restart', action: () => { openStart(false); location.reload(); } },
      { label: 'Shut down', action: () => { openStart(false); shutdown(); } }]);
  }
  function shutdown() {
    const o = h('div', { class: 'off', onclick: () => o.remove() }, h('div', {}, 'Click anywhere to power on'));
    $('#screen').append(o);
  }
  function lock() { const l = $('#lock'); l.classList.remove('gone'); }

  /* ---------- quick settings ---------- */
  function buildQuick() {
    const state = { wifi: true, bt: true, plane: false, saver: false };
    const tile = (key, label, icon) => {
      const b = h('button', { class: 'q-tile on', onclick: () => { state[key] = !state[key]; b.classList.toggle('on', state[key]); } }, h('span', { html: Icons[icon] }), label);
      b.classList.toggle('on', state[key]); return b;
    };
    const dark = h('button', { class: 'q-tile', onclick: () => { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; W11.applySettings(); } }, h('span', { html: Icons.moon }), 'Dark mode');
    const sync = () => dark.classList.toggle('on', settings.theme === 'dark');
    bus.on('settings', sync); sync();
    $('#q-tiles').replaceChildren(tile('wifi', 'Wi-Fi', 'wifi'), tile('bt', 'Bluetooth', 'bluetooth'), tile('plane', 'Airplane', 'plane'), dark, tile('saver', 'Battery saver', 'battery'),
      h('button', { class: 'q-tile', onclick: () => { closeFlyouts(); W11.openApp('settings'); } }, h('span', { html: Icons.settings.replace('#78909c', 'currentColor') }), 'All settings'));
    $('#q-sun').innerHTML = Icons.sun; $('#q-vol').innerHTML = Icons.volume;
    const b = $('#q-bright'); b.value = settings.brightness;
    b.addEventListener('input', () => { settings.brightness = +b.value; W11.applySettings(); });
    $('#tb-tray').innerHTML = `<span class="ti">${Icons.wifi}</span><span class="ti">${Icons.volume}</span><span class="ti">${Icons.battery}</span>`;
  }

  /* ---------- calendar ---------- */
  let calDate = new Date();
  function renderCalendar() {
    const el = $('#calendar'), now = new Date();
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(h('span', { class: 'cd empty' }));
    for (let d = 1; d <= days; d++) cells.push(h('span', { class: 'cd' + (d === now.getDate() && m === now.getMonth() && y === now.getFullYear() ? ' today' : '') }, d));
    el.replaceChildren(
      h('div', { class: 'cal-big' }, now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })),
      h('div', { class: 'cal-head' },
        h('b', {}, calDate.toLocaleDateString([], { month: 'long', year: 'numeric' })),
        h('span', {}, h('button', { class: 'tbtn', html: Icons.up, onclick: () => { calDate = new Date(y, m - 1, 1); renderCalendar(); } }),
          h('button', { class: 'tbtn dn', html: Icons.up, onclick: () => { calDate = new Date(y, m + 1, 1); renderCalendar(); } }))),
      h('div', { class: 'cal-grid' }, ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => h('span', { class: 'cd dow' }, d)), cells));
  }

  /* ---------- wiring ---------- */
  function init() {
    W11.applySettings();
    renderIcons(); renderPinned(); renderTaskbar(); buildQuick(); tick();
    setInterval(() => { tick(); if (!$('#calendar').classList.contains('hidden')) { const t = $('.cal-big'); if (t) t.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }); } }, 1000);

    $('#power-btn').innerHTML = Icons.power;
    $('#power-btn').addEventListener('click', e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); powerMenu(r.left, r.top - 110); });
    $('#user-btn').addEventListener('click', () => { openStart(false); W11.openApp('settings', { page: 'system' }); });
    const syncUser = () => { $('#user-name').textContent = settings.user; };
    bus.on('settings', syncUser); syncUser();

    $('#start-search').addEventListener('input', e => searchStart(e.target.value));
    $('#start-search').addEventListener('keydown', e => { if (e.key === 'Enter') { const r = $('#start-results')._first; if (r) { openStart(false); r.run(); } } });

    $('#tb-tray').addEventListener('click', e => { e.stopPropagation(); toggleFlyout($('#quick')); });
    $('#tb-clock').addEventListener('click', e => { e.stopPropagation(); calDate = new Date(); renderCalendar(); toggleFlyout($('#calendar')); });
    $('#tb-show').addEventListener('click', () => {
      const open = W11.wins.filter(w => !w.el.classList.contains('minimized'));
      if (open.length) open.forEach(w => W11.minimize(w)); else W11.wins.forEach(w => W11.restore(w));
    });

    // click outside closes flyouts; flyouts themselves don't
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('.flyout, #taskbar, .ctx, .modal')) closeFlyouts();
      if (!e.target.closest('.dicon')) $$('.dicon.sel').forEach(x => x.classList.remove('sel'));
    });
    $$('.flyout').forEach(f => f.addEventListener('pointerdown', e => e.stopPropagation()));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeFlyouts();
      if (e.key === 'Meta' && !e.repeat) { e.preventDefault(); openStart(start().classList.contains('hidden')); }
      if (e.altKey && e.key === 'F4') { const t = W11.wins.filter(w => w.el.classList.contains('active'))[0]; if (t) { e.preventDefault(); t.close(); } }
    });

    // desktop context menu
    $('#desktop').addEventListener('contextmenu', e => {
      if (e.target.closest('.win')) return;
      e.preventDefault();
      menu(e.clientX, e.clientY, [
        { label: 'Refresh', action: renderIcons },
        { label: 'New folder', action: () => { FS.mkdir('/Desktop/' + FS.unique('/Desktop', 'New folder')); } },
        { label: 'New text document', action: () => { FS.write('/Desktop/' + FS.unique('/Desktop', 'New Text Document', '.txt'), ''); } }, '-',
        { label: 'Open Terminal here', action: () => W11.openApp('terminal') },
        { label: 'Display settings', action: () => W11.openApp('settings', { page: 'system' }) },
        { label: 'Personalize', action: () => W11.openApp('settings', { page: 'personalization' }) }]);
    });

    bus.on('wins', renderTaskbar);
    bus.on('fs', () => { renderIcons(); renderRecent(); });
    bus.on('settings', () => {});

    // lock screen
    const lk = $('#lock');
    const unlock = () => { lk.classList.add('gone'); };
    lk.addEventListener('click', unlock);
    document.addEventListener('keydown', () => { if (!lk.classList.contains('gone')) unlock(); });

    // boot sequence
    $('.boot-logo').innerHTML = Icons.start;
    setTimeout(() => $('#boot').classList.add('gone'), 1400);

    // first-run welcome
    if (!W11.store.get('welcomed', false)) {
      W11.store.set('welcomed', true);
      setTimeout(() => W11.openApp('notepad', { path: '/Documents/Welcome.txt' }), 2000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* core.js - helpers, persistent settings, dialogs, context menus, window manager */
(function (g) {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /** Tiny hyperscript helper: h('div', {class:'x', onclick:fn}, child, 'text') */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return e;
  }

  const bus = (() => {
    const m = {};
    return {
      on(n, f) { (m[n] = m[n] || []).push(f); },
      emit(n, a) { (m[n] || []).forEach(f => { try { f(a); } catch (e) { console.error(e); } }); }
    };
  })();

  const store = {
    get(k, d) { try { const v = localStorage.getItem('w11:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('w11:' + k, JSON.stringify(v)); } catch (e) { /* quota */ } },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith('w11:')).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ } }
  };

  /* ---------- settings & personalization ---------- */
  const wallpapers = [
    'radial-gradient(at 20% 30%,#5ec3ff 0,transparent 45%),radial-gradient(at 80% 20%,#a78bfa 0,transparent 45%),radial-gradient(at 60% 90%,#2563eb 0,transparent 50%),linear-gradient(135deg,#1e3a8a,#0ea5e9)',
    'radial-gradient(at 15% 80%,#fb7185 0,transparent 45%),radial-gradient(at 85% 25%,#fbbf24 0,transparent 45%),linear-gradient(135deg,#7c3aed,#db2777)',
    'radial-gradient(at 30% 20%,#34d399 0,transparent 45%),radial-gradient(at 80% 80%,#0ea5e9 0,transparent 50%),linear-gradient(160deg,#064e3b,#0f766e)',
    'radial-gradient(at 70% 20%,#475569 0,transparent 50%),radial-gradient(at 20% 85%,#1e293b 0,transparent 55%),linear-gradient(135deg,#0f172a,#312e81)'
  ];
  const accents = ['#0a64d6', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#16a34a', '#0d9488', '#475569'];
  const settings = Object.assign({ theme: 'light', accent: '#0a64d6', wallpaper: 0, brightness: 100, user: 'User' }, store.get('settings', {}));

  function applySettings() {
    document.body.classList.toggle('dark', settings.theme === 'dark');
    document.body.classList.toggle('light', settings.theme !== 'dark');
    document.documentElement.style.setProperty('--accent', settings.accent);
    const d = $('#desktop');
    if (d) d.style.background = wallpapers[settings.wallpaper % wallpapers.length];
    const s = $('#screen');
    if (s) s.style.filter = settings.brightness >= 100 ? '' : `brightness(${Math.max(30, settings.brightness)}%)`;
    store.set('settings', settings);
    bus.emit('settings');
  }

  /* ---------- context / app menus ---------- */
  let menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  /** items: [{label, action, disabled, icon}] or '-' for a separator */
  function menu(x, y, items) {
    closeMenu();
    menuEl = h('div', { class: 'ctx', onpointerdown: e => e.stopPropagation() },
      items.map(it => it === '-' ? h('div', { class: 'ctx-sep' }) :
        h('button', {
          class: 'ctx-item', disabled: it.disabled,
          onclick: () => { closeMenu(); it.action && it.action(); }
        }, h('span', {}, it.label), it.hint ? h('span', { class: 'ctx-hint' }, it.hint) : null)));
    $('#screen').append(menuEl);
    const r = menuEl.getBoundingClientRect();
    menuEl.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
    menuEl.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 52)) + 'px';
  }
  document.addEventListener('pointerdown', e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }, true);
  addEventListener('blur', closeMenu);

  /* ---------- modal dialogs ---------- */
  function dialog(title, bodyEls, buttons) {
    const ov = h('div', { class: 'modal' });
    const box = h('div', { class: 'dialog' },
      h('div', { class: 'dialog-title' }, title),
      h('div', { class: 'dialog-body' }, bodyEls),
      h('div', { class: 'dialog-btns' }, buttons.map(b => h('button', {
        class: 'btn' + (b.primary ? ' primary' : ''),
        onclick: () => { ov.remove(); b.action && b.action(); }
      }, b.label))));
    ov.append(box);
    $('#screen').append(ov);
    const inp = $('input', box); if (inp) { inp.focus(); inp.select(); }
    return ov;
  }
  const ui = {
    alert(title, msg) { dialog(title, h('p', {}, msg), [{ label: 'OK', primary: true }]); },
    confirm(title, msg, yes) { dialog(title, h('p', {}, msg), [{ label: 'Yes', primary: true, action: yes }, { label: 'No' }]); },
    prompt(title, value, cb, label) {
      const inp = h('input', { class: 'input', value: value || '', spellcheck: 'false' });
      const ov = dialog(title, [label ? h('p', {}, label) : null, inp], [
        { label: 'OK', primary: true, action: () => cb(inp.value) }, { label: 'Cancel' }]);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { ov.remove(); cb(inp.value); }
        if (e.key === 'Escape') ov.remove();
      });
    }
  };

  /* ---------- window manager ---------- */
  const Apps = {};
  const wins = [];
  let zTop = 100, counter = 0;

  function registerApp(def) { Apps[def.id] = def; }

  function desk() { return $('#windows'); }

  function openApp(id, args) {
    const app = Apps[id];
    if (!app) return null;
    if (app.single) {
      const ex = wins.find(w => w.app.id === id);
      if (ex) { restore(ex); focus(ex); if (app.onArgs) app.onArgs(ex, args); return ex; }
    }
    return createWindow(app, args || {});
  }

  function createWindow(app, args) {
    const area = desk();
    const n = counter++;
    const aw = area.clientWidth, ah = area.clientHeight;
    const w = Math.min(app.w || 720, aw - 16), hh = Math.min(app.h || 480, ah - 16);
    const x = Math.max(0, Math.min(40 + (n % 9) * 32, aw - w)), y = Math.max(0, Math.min(24 + (n % 9) * 32, ah - hh));

    const titleEl = h('span', { class: 'wtitle' }, app.name);
    const btnMin = h('button', { class: 'wbtn', title: 'Minimize', html: '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5h8" stroke="currentColor"/></svg>' });
    const btnMax = h('button', { class: 'wbtn', title: 'Maximize', html: '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="none" stroke="currentColor"/></svg>' });
    const btnClose = h('button', { class: 'wbtn close', title: 'Close', html: '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor"/></svg>' });
    const bar = h('div', { class: 'titlebar' },
      h('span', { class: 'wicon', html: Icons[app.icon] || '' }), titleEl,
      h('div', { class: 'wctl' }, btnMin, btnMax, btnClose));
    const body = h('div', { class: 'wbody' });
    const el = h('div', { class: 'win opening', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' } },
      bar, body, ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => h('div', { class: 'rz rz-' + d, 'data-dir': d })));
    area.append(el);
    setTimeout(() => el.classList.remove('opening'), 200);

    const win = {
      id: n, app, el, body, state: 'normal', prev: null, onClose: null,
      setTitle(t) { titleEl.textContent = t; win.title = t; bus.emit('wins'); },
      close() { closeWin(win); }, focus() { focus(win); }
    };
    win.title = app.name;
    wins.push(win);

    el.addEventListener('pointerdown', () => focus(win), true);
    btnMin.addEventListener('click', () => minimize(win));
    btnMax.addEventListener('click', () => toggleMax(win));
    btnClose.addEventListener('click', () => closeWin(win));
    bar.addEventListener('dblclick', e => { if (!e.target.closest('.wctl')) toggleMax(win); });
    wireDrag(win, bar);
    wireResize(win);

    app.create(win, args);
    focus(win);
    bus.emit('wins');
    return win;
  }

  function focus(win) {
    restore(win); // no-op unless the window is minimized
    win.el.style.zIndex = ++zTop;
    wins.forEach(w => w.el.classList.toggle('active', w === win));
    win.focused = true;
    bus.emit('wins');
    const t = win.el.querySelector('[data-autofocus]'); if (t && document.activeElement === document.body) t.focus();
  }
  function minimize(win) {
    win.state = win.state === 'max' ? 'min-max' : 'min';
    win.el.classList.add('minimized');
    win.el.classList.remove('active');
    bus.emit('wins');
  }
  function restore(win) {
    if (win.state === 'min' || win.state === 'min-max') {
      win.state = win.state === 'min-max' ? 'max' : 'normal';
      win.el.classList.remove('minimized');
      win.el.style.zIndex = ++zTop;
      bus.emit('wins');
    }
  }
  function toggleMax(win) {
    if (win.state === 'max') {
      win.state = 'normal'; win.el.classList.remove('maximized');
      if (win.prev) Object.assign(win.el.style, win.prev);
    } else {
      const s = win.el.style;
      win.prev = { left: s.left, top: s.top, width: s.width, height: s.height };
      win.state = 'max'; win.el.classList.add('maximized');
    }
    bus.emit('wins');
  }
  function snapTo(win, side) {
    const a = desk(), W = a.clientWidth, H = a.clientHeight, s = win.el.style;
    if (win.state !== 'max') win.prev = win.prev || { left: s.left, top: s.top, width: s.width, height: s.height };
    win.state = 'normal'; win.el.classList.remove('maximized');
    s.top = '0px'; s.height = H + 'px'; s.width = W / 2 + 'px'; s.left = side === 'left' ? '0px' : W / 2 + 'px';
  }
  function closeWin(win) {
    if (win.onClose && win.onClose() === false) return;
    win.el.classList.add('closing');
    setTimeout(() => win.el.remove(), 120);
    const i = wins.indexOf(win); if (i >= 0) wins.splice(i, 1);
    bus.emit('wins');
  }

  function wireDrag(win, bar) {
    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.wctl')) return;
      const el = win.el, a = desk(), snap = $('#snap');
      let sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop, moved = false, side = null;
      bar.setPointerCapture(e.pointerId);
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
        if (!moved && win.state === 'max') {
          // grab from maximized: restore under the cursor
          const pr = win.prev || { width: '700px', height: '460px' };
          const pw = parseFloat(pr.width);
          el.classList.remove('maximized'); win.state = 'normal';
          el.style.width = pr.width; el.style.height = pr.height;
          ox = Math.max(0, Math.min(ev.clientX - pw * (sx / a.clientWidth), a.clientWidth - pw)); oy = 0;
          sx = ev.clientX; sy = ev.clientY; bus.emit('wins');
        }
        moved = true;
        const nx = ox + (ev.clientX - sx), ny = Math.max(0, oy + (ev.clientY - sy));
        el.style.left = nx + 'px'; el.style.top = Math.min(ny, a.clientHeight - 36) + 'px';
        const px = ev.clientX, py = ev.clientY;
        side = py < 6 ? 'max' : px < 6 ? 'left' : px > innerWidth - 6 ? 'right' : null;
        if (snap) {
          snap.className = side ? 'show ' + side : '';
        }
      };
      const up = () => {
        bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up);
        if (snap) snap.className = '';
        if (moved && side === 'max') { win.prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }; toggleMax(win); }
        else if (moved && side) snapTo(win, side);
      };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
    });
  }

  function wireResize(win) {
    $$('.rz', win.el).forEach(hd => hd.addEventListener('pointerdown', e => {
      if (win.state === 'max') return;
      e.preventDefault(); e.stopPropagation(); focus(win);
      const dir = hd.dataset.dir, el = win.el, a = desk();
      const sx = e.clientX, sy = e.clientY, L = el.offsetLeft, T = el.offsetTop, W = el.offsetWidth, H = el.offsetHeight;
      const minW = 300, minH = 200;
      hd.setPointerCapture(e.pointerId);
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let nl = L, nt = T, nw = W, nh = H;
        if (dir.includes('e')) nw = Math.max(minW, W + dx);
        if (dir.includes('s')) nh = Math.max(minH, H + dy);
        if (dir.includes('w')) { nw = Math.max(minW, W - dx); nl = L + (W - nw); }
        if (dir.includes('n')) { nh = Math.max(minH, H - dy); nt = Math.max(0, T + (H - nh)); nh = H + (T - nt); }
        Object.assign(el.style, { left: nl + 'px', top: nt + 'px', width: nw + 'px', height: nh + 'px' });
      };
      const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up);
    }));
  }

  g.W11 = {
    $, $$, h, bus, store, settings, wallpapers, accents, applySettings,
    menu, closeMenu, dialog, ui,
    Apps, wins, registerApp, openApp, focus, minimize, restore, toggleMax, closeWin
  };
})(window);

/* Settings */
(function () {
  'use strict';
  const { h, settings, wallpapers, accents, ui } = W11;

  W11.registerApp({
    id: 'settings', name: 'Settings', icon: 'settings', w: 780, h: 520, single: true,
    onArgs(win, args) { if (args && args.page && win.go) win.go(args.page); },
    create(win, args) {
      const content = h('div', { class: 'st-content' });
      const nav = h('div', { class: 'st-nav' });

      const row = (title, desc, control) => h('div', { class: 'st-row' }, h('div', {}, h('div', { class: 'st-t' }, title), desc ? h('div', { class: 'st-d' }, desc) : null), control);

      const pages = {
        system() {
          return [h('h2', {}, 'System'),
            row('Display brightness', 'Dims the whole desktop', h('input', { type: 'range', min: 30, max: 100, value: settings.brightness, oninput: e => { settings.brightness = +e.target.value; W11.applySettings(); } })),
            row('Username', 'Shown in the Start menu and Terminal', h('input', { class: 'input', style: { width: '160px' }, value: settings.user, onchange: e => { settings.user = e.target.value.trim() || 'User'; W11.applySettings(); } })),
            h('h3', {}, 'About'),
            row('Device name', null, h('span', { class: 'st-d' }, 'win11-web')),
            row('Screen', null, h('span', { class: 'st-d' }, innerWidth + ' × ' + innerHeight)),
            row('Storage', 'Virtual files saved in this browser (localStorage)', h('button', { class: 'btn', onclick: () => ui.confirm('Reset', 'Erase all files and settings and reload?', () => { W11.store.clear(); location.reload(); }) }, 'Reset everything'))];
        },
        personalization() {
          const wp = h('div', { class: 'wp-grid' }, wallpapers.map((w, i) => h('button', { class: 'wp' + (settings.wallpaper === i ? ' on' : ''), style: { background: w },
            onclick: () => { settings.wallpaper = i; W11.applySettings(); show('personalization'); } })));
          const ac = h('div', { class: 'ac-grid' }, accents.map(c => h('button', { class: 'ac' + (settings.accent === c ? ' on' : ''), style: { background: c }, title: c,
            onclick: () => { settings.accent = c; W11.applySettings(); show('personalization'); } })));
          return [h('h2', {}, 'Personalization'),
            row('Mode', 'Choose light or dark', h('div', { class: 'seg' }, ['light', 'dark'].map(t => h('button', { class: 'btn' + (settings.theme === t ? ' primary' : ''), onclick: () => { settings.theme = t; W11.applySettings(); show('personalization'); } }, t[0].toUpperCase() + t.slice(1))))),
            h('h3', {}, 'Background'), wp, h('h3', {}, 'Accent color'), ac];
        },
        apps() {
          return [h('h2', {}, 'Apps'), ...Object.values(W11.Apps).map(a => row(a.name, a.id, h('button', { class: 'btn', onclick: () => W11.openApp(a.id) }, 'Open')))];
        }
      };
      const labels = { system: 'System', personalization: 'Personalization', apps: 'Apps' };
      function show(p) {
        content.replaceChildren(...pages[p]());
        nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
      }
      win.go = show;
      Object.keys(labels).forEach(p => nav.append(h('button', { class: 'side-item', 'data-p': p, onclick: () => show(p) }, labels[p])));
      win.body.append(h('div', { class: 'settings' }, nav, content));
      show((args && args.page) || 'system');
    }
  });
})();

/* File Explorer */
(function () {
  'use strict';
  const { h, $, menu, ui, bus } = W11;

  const places = [
    ['This PC', '/', 'computer'], ['Desktop', '/Desktop', 'folder'], ['Documents', '/Documents', 'folder'],
    ['Downloads', '/Downloads', 'folder'], ['Pictures', '/Pictures', 'image'], ['Music', '/Music', 'folder'], ['Videos', '/Videos', 'folder']
  ];
  const textExt = /\.(txt|md|js|json|html?|css|log|csv|xml|ini|cfg|yml|yaml|py)$/i;

  function openPath(path) {
    if (FS.isDir(path)) return W11.openApp('explorer', { path });
    if (textExt.test(path) || FS.read(path) != null) return W11.openApp('notepad', { path });
  }
  window.openPath = openPath;

  function fmtSize(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }

  W11.registerApp({
    id: 'explorer', name: 'File Explorer', icon: 'explorer', w: 820, h: 500,
    create(win, args) {
      let cwd = FS.norm(args.path || '/'), hist = [cwd], hi = 0, sel = null;
      const list = h('div', { class: 'ex-list' });
      const addr = h('div', { class: 'ex-addr' });
      const status = h('div', { class: 'ex-status' });
      const back = h('button', { class: 'tbtn', title: 'Back', html: Icons.back, onclick: () => go(hist[hi - 1], -1) });
      const fwd = h('button', { class: 'tbtn', title: 'Forward', html: Icons.forward, onclick: () => go(hist[hi + 1], 1) });
      const up = h('button', { class: 'tbtn', title: 'Up', html: Icons.up, onclick: () => cwd !== '/' && nav(FS.norm(cwd + '/..')) });

      const side = h('div', { class: 'ex-side' }, places.map(([label, path, icon]) =>
        h('button', { class: 'side-item', 'data-path': path, onclick: () => nav(path) }, h('span', { class: 'si', html: Icons[icon] }), label)));

      const actions = h('div', { class: 'ex-actions' },
        h('button', { class: 'btn', onclick: newFolder }, '＋ New folder'),
        h('button', { class: 'btn', onclick: newText }, '＋ New text file'),
        h('button', { class: 'btn', onclick: () => sel && rename(sel) }, 'Rename'),
        h('button', { class: 'btn', onclick: () => sel && del(sel) }, 'Delete'));

      win.body.append(h('div', { class: 'explorer' },
        h('div', { class: 'ex-toolbar' }, back, fwd, up, addr), actions,
        h('div', { class: 'ex-main' }, side, h('div', { class: 'ex-content' },
          h('div', { class: 'ex-head' }, h('span', {}, 'Name'), h('span', {}, 'Type'), h('span', {}, 'Size')), list)),
        status));

      function nav(p) { p = FS.norm(p); if (p === cwd) return; hist = hist.slice(0, hi + 1); hist.push(p); hi++; cwd = p; sel = null; render(); }
      function go(p, d) { if (p == null) return; hi += d; cwd = p; sel = null; render(); }

      function newFolder() { const n = FS.unique(cwd, 'New folder'); FS.mkdir(cwd + '/' + n); sel = FS.norm(cwd + '/' + n); render(); rename(sel); }
      function newText() { const n = FS.unique(cwd, 'New Text Document', '.txt'); FS.write(cwd + '/' + n, ''); sel = FS.norm(cwd + '/' + n); render(); rename(sel); }
      function rename(p) {
        const name = p.split('/').pop();
        ui.prompt('Rename', name, v => { v = v.trim(); if (v && v !== name && !FS.rename(p, v)) ui.alert('Rename', 'That name is invalid or already exists.'); sel = null; render(); }, 'New name:');
      }
      function del(p) { ui.confirm('Delete', `Delete "${p.split('/').pop()}"? This cannot be undone.`, () => { FS.rm(p); sel = null; render(); }); }

      function render() {
        const items = FS.list(cwd);
        list.replaceChildren(...items.map(it => {
          const row = h('div', { class: 'ex-row' + (sel === it.path ? ' sel' : ''), tabindex: '0',
            onclick: () => { sel = it.path; $('.sel', list) && $('.sel', list).classList.remove('sel'); row.classList.add('sel'); },
            ondblclick: () => it.type === 'dir' ? nav(it.path) : openPath(it.path),
            oncontextmenu: e => {
              e.preventDefault(); e.stopPropagation(); sel = it.path; render();
              menu(e.clientX, e.clientY, [
                { label: 'Open', action: () => it.type === 'dir' ? nav(it.path) : openPath(it.path) }, '-',
                { label: 'Rename', action: () => rename(it.path) }, { label: 'Delete', action: () => del(it.path) }]);
            }
          }, h('span', { class: 'nm' }, h('span', { class: 'fi', html: Icons[it.type === 'dir' ? 'folder' : 'file'] }), it.name),
            h('span', {}, it.type === 'dir' ? 'File folder' : ((it.name.split('.').pop() || 'file').toUpperCase() + ' File')),
            h('span', {}, it.type === 'dir' ? '' : fmtSize(it.size)));
          return row;
        }));
        if (!items.length) list.append(h('div', { class: 'ex-empty' }, 'This folder is empty.'));
        const crumbs = ['This PC', ...cwd.split('/').filter(Boolean)];
        addr.replaceChildren(...crumbs.flatMap((c, i) => {
          const p = i === 0 ? '/' : '/' + crumbs.slice(1, i + 1).join('/');
          return [i ? h('span', { class: 'sep' }, '›') : null, h('button', { class: 'crumb', onclick: () => nav(p) }, c)];
        }));
        status.textContent = `${items.length} item${items.length === 1 ? '' : 's'}` + (sel ? '  |  1 item selected' : '');
        back.disabled = hi === 0; fwd.disabled = hi >= hist.length - 1; up.disabled = cwd === '/';
        side.querySelectorAll('.side-item').forEach(b => b.classList.toggle('on', b.dataset.path === cwd));
        win.setTitle((cwd === '/' ? 'This PC' : cwd.split('/').pop()) + ' - File Explorer');
      }

      list.addEventListener('contextmenu', e => {
        e.preventDefault();
        menu(e.clientX, e.clientY, [{ label: 'New folder', action: newFolder }, { label: 'New text file', action: newText }, '-', { label: 'Refresh', action: render }]);
      });
      list.addEventListener('click', e => { if (e.target === list) { sel = null; render(); } });
      bus.on('fs', () => { if (document.body.contains(win.el)) render(); });
      render();
    },
    onArgs(win, args) { /* single-instance not used */ }
  });
})();

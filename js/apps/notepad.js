/* Notepad */
(function () {
  'use strict';
  const { h, menu, ui } = W11;

  W11.registerApp({
    id: 'notepad', name: 'Notepad', icon: 'notepad', w: 640, h: 420,
    create(win, args) {
      let path = args.path || null, dirty = false;
      const ta = h('textarea', { class: 'np-text', spellcheck: 'false', 'data-autofocus': '' });
      const status = h('div', { class: 'np-status' });

      function title() { win.setTitle(`${dirty ? '*' : ''}${path ? path.split('/').pop() : 'Untitled'} - Notepad`); }
      function stats() {
        const before = ta.value.slice(0, ta.selectionStart).split('\n');
        status.textContent = `Ln ${before.length}, Col ${before[before.length - 1].length + 1}    ${ta.value.length} characters`;
      }
      function load(p) {
        const d = FS.read(p);
        if (d == null) return ui.alert('Notepad', 'File not found: ' + p);
        path = FS.norm(p); ta.value = d; dirty = false; title(); stats();
      }
      function saveAs(cb) {
        ui.prompt('Save as', path || '/Documents/Untitled.txt', p => {
          p = FS.norm(p);
          if (!FS.write(p, ta.value)) return ui.alert('Save', 'Could not save to ' + p + '. Does the folder exist?');
          path = p; dirty = false; title(); cb && cb();
        }, 'Full path:');
      }
      function save() { if (!path) return saveAs(); FS.write(path, ta.value); dirty = false; title(); }
      function guard(next) {
        if (!dirty) return next();
        W11.dialog('Notepad', h('p', {}, 'Do you want to save changes?'), [
          { label: 'Save', primary: true, action: () => (path ? (save(), next()) : saveAs(next)) },
          { label: "Don't save", action: next }, { label: 'Cancel' }]);
      }

      const mb = (label, items) => h('button', { class: 'mbtn', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); menu(r.left, r.bottom, items); } }, label);
      const bar = h('div', { class: 'np-menu' },
        mb('File', [
          { label: 'New', hint: 'Ctrl+N', action: () => guard(() => { path = null; ta.value = ''; dirty = false; title(); stats(); }) },
          { label: 'Open…', hint: 'Ctrl+O', action: () => guard(() => ui.prompt('Open', '/Documents/Welcome.txt', load, 'Full path:')) },
          { label: 'Save', hint: 'Ctrl+S', action: save }, { label: 'Save as…', action: () => saveAs() }, '-',
          { label: 'Exit', action: () => win.close() }]),
        mb('Edit', [
          { label: 'Select all', hint: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
          { label: 'Insert date/time', action: () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); } }]),
        mb('View', [
          { label: 'Toggle word wrap', action: () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre' ? 'pre-wrap' : 'pre'; } },
          { label: 'Zoom in', action: () => { ta.style.fontSize = (parseFloat(getComputedStyle(ta).fontSize) + 2) + 'px'; } },
          { label: 'Zoom out', action: () => { ta.style.fontSize = Math.max(8, parseFloat(getComputedStyle(ta).fontSize) - 2) + 'px'; } }]));

      ta.addEventListener('input', () => { dirty = true; title(); stats(); });
      ['keyup', 'click'].forEach(ev => ta.addEventListener(ev, stats));
      ta.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
        if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
      });
      win.onClose = () => { if (!dirty) return true; guard(() => { dirty = false; win.close(); }); return false; };

      win.body.append(h('div', { class: 'notepad' }, bar, ta, status));
      if (path) load(path); else { title(); stats(); }
    }
  });
})();

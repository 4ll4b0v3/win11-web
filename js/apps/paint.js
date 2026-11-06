/* Paint */
(function () {
  'use strict';
  const { h } = W11;

  W11.registerApp({
    id: 'paint', name: 'Paint', icon: 'paint', w: 760, h: 520,
    create(win) {
      let color = '#000000', size = 4, tool = 'pen', drawing = false, last = null;
      const cv = h('canvas', { class: 'pt-canvas', width: 1200, height: 800 });
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); draw(last, last); });
      cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); draw(last, p); last = p; });
      ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drawing = false; }));
      function draw(a, b) {
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
      }

      const swatches = ['#000000', '#ffffff', '#e11d48', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#92400e'];
      const toolBtns = ['pen', 'eraser'].map(t => h('button', { class: 'btn' + (t === tool ? ' primary' : ''), onclick: e => { tool = t; toolBtns.forEach(b => b.classList.remove('primary')); e.currentTarget.classList.add('primary'); } }, t === 'pen' ? 'Brush' : 'Eraser'));
      const picker = h('input', { type: 'color', value: color, class: 'pt-color', oninput: e => { color = e.target.value; tool = 'pen'; toolBtns[0].click(); } });

      win.body.append(h('div', { class: 'paint' },
        h('div', { class: 'pt-tools' }, toolBtns, picker,
          swatches.map(c => h('button', { class: 'swatch', style: { background: c }, title: c, onclick: () => { color = c; picker.value = c; toolBtns[0].click(); } })),
          h('label', { class: 'pt-size' }, 'Size ', h('input', { type: 'range', min: 1, max: 40, value: size, oninput: e => { size = +e.target.value; } })),
          h('button', { class: 'btn', onclick: () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); } }, 'Clear'),
          h('button', { class: 'btn', onclick: () => { const a = h('a', { href: cv.toDataURL('image/png'), download: 'painting.png' }); document.body.append(a); a.click(); a.remove(); } }, 'Download PNG')),
        h('div', { class: 'pt-wrap' }, cv)));
    }
  });
})();

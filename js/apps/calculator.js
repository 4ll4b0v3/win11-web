/* Calculator (no eval - simple state machine) */
(function () {
  'use strict';
  const { h } = W11;

  W11.registerApp({
    id: 'calculator', name: 'Calculator', icon: 'calculator', w: 340, h: 520, single: false,
    create(win) {
      let cur = '0', acc = null, op = null, fresh = true, expr = '';
      const disp = h('div', { class: 'calc-disp' }, '0');
      const exprEl = h('div', { class: 'calc-expr' });

      const calc = (a, b, o) => {
        switch (o) {
          case '+': return a + b; case '−': return a - b; case '×': return a * b;
          case '÷': return b === 0 ? NaN : a / b;
        }
        return b;
      };
      const fmt = n => {
        if (!isFinite(n)) return n === Infinity || isNaN(n) ? 'Cannot divide by zero' : String(n);
        let s = String(+n.toPrecision(14));
        return s;
      };
      const show = () => { disp.textContent = cur; exprEl.textContent = expr; disp.style.fontSize = cur.length > 12 ? '26px' : cur.length > 9 ? '34px' : '44px'; };
      const err = () => cur === 'Cannot divide by zero';

      function press(k) {
        if (err() && k !== 'C' && k !== 'CE') { cur = '0'; acc = null; op = null; expr = ''; fresh = true; }
        if (/^\d$/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; }
        else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
        else if (k === 'C') { cur = '0'; acc = null; op = null; expr = ''; fresh = true; }
        else if (k === 'CE') { cur = '0'; fresh = true; }
        else if (k === '⌫') { if (!fresh) { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; if (cur === '-') cur = '0'; } }
        else if (k === '±') { if (cur !== '0') cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur; }
        else if (k === '%') { cur = fmt((parseFloat(cur) / 100) * (acc != null ? acc : 1)); fresh = true; }
        else if (k === '1/x') { cur = fmt(1 / parseFloat(cur)); fresh = true; }
        else if (k === 'x²') { cur = fmt(Math.pow(parseFloat(cur), 2)); fresh = true; }
        else if (k === '√x') { const v = parseFloat(cur); cur = v < 0 ? 'Invalid input' : fmt(Math.sqrt(v)); fresh = true; }
        else if ('+−×÷'.includes(k)) {
          if (op && !fresh) { acc = calc(acc, parseFloat(cur), op); cur = fmt(acc); } else acc = parseFloat(cur);
          op = k; expr = `${fmt(acc)} ${k}`; fresh = true;
        } else if (k === '=') {
          if (op) { const b = parseFloat(cur); expr = `${fmt(acc)} ${op} ${fmt(b)} =`; cur = fmt(calc(acc, b, op)); acc = null; op = null; fresh = true; }
        }
        if (cur === 'Invalid input') { acc = null; op = null; }
        show();
      }

      const keys = ['%', 'CE', 'C', '⌫', '1/x', 'x²', '√x', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '='];
      const grid = h('div', { class: 'calc-grid' }, keys.map(k =>
        h('button', { class: 'ck' + (/\d/.test(k) ? ' num' : k === '=' ? ' eq' : ''), onclick: () => press(k) }, k)));
      win.body.append(h('div', { class: 'calculator', tabindex: '0',
        onkeydown: e => {
          const m = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C', Delete: 'CE' };
          const k = m[e.key] || e.key;
          if (/^[\d.+=]$/.test(k) || '×÷−⌫'.includes(k) || k === 'C' || k === 'CE') { e.preventDefault(); press(k); }
        }
      }, exprEl, disp, grid));
      win.body.firstChild.focus();
      win.el.addEventListener('pointerdown', () => setTimeout(() => win.body.firstChild && win.body.firstChild.focus(), 0));
    }
  });
})();

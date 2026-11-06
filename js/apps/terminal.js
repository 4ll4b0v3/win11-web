/* Terminal - a small shell on top of the virtual file system */
(function () {
  'use strict';
  const { h, settings } = W11;

  function parse(line) {
    const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m;
    while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
    return out;
  }

  W11.registerApp({
    id: 'terminal', name: 'Terminal', icon: 'terminal', w: 700, h: 440,
    create(win) {
      let cwd = '/', histI = [], hp = 0;
      const out = h('div', { class: 'term-out' });
      const promptEl = h('span', { class: 'term-prompt' });
      const input = h('input', { class: 'term-in', spellcheck: 'false', autocomplete: 'off', 'data-autofocus': '' });
      const line = h('div', { class: 'term-line' }, promptEl, input);
      const root = h('div', { class: 'terminal', onclick: () => { if (!getSelection().toString()) input.focus(); } }, out, line);
      win.body.append(root);

      const p = () => (cwd === '/' ? '~' : cwd);
      const setPrompt = () => { promptEl.textContent = `${settings.user.toLowerCase()}@win11-web:${p()}$ `; };
      const print = (t = '', cls = '') => { out.append(h('div', { class: 'tl ' + cls }, t)); root.scrollTop = root.scrollHeight; };
      const abs = a => FS.norm(a.startsWith('/') ? a : cwd + '/' + a);

      const cmds = {
        help() {
          print('Commands:');
          ['help', 'ls [dir]', 'cd <dir>', 'pwd', 'cat <file>', 'mkdir <dir>', 'touch <file>', 'rm <path>', 'mv <old> <new>',
            'echo <text> [> file]', 'clear', 'date', 'whoami', 'neofetch', 'open <app|path>', 'theme <light|dark>', 'apps']
            .forEach(c => print('  ' + c));
        },
        ls(a) { const d = abs(a[0] || '.'); if (!FS.isDir(d)) return print('ls: cannot access: no such directory', 'err'); print(FS.list(d).map(i => i.type === 'dir' ? i.name + '/' : i.name).join('   ') || '(empty)'); },
        cd(a) { const d = abs(a[0] || '/'); if (!FS.isDir(d)) return print('cd: no such directory: ' + (a[0] || ''), 'err'); cwd = d; },
        pwd() { print(cwd); },
        cat(a) { const d = FS.read(abs(a[0] || '')); if (d == null) return print('cat: no such file', 'err'); print(d || '(empty)'); },
        mkdir(a) { if (!a[0] || !FS.mkdir(abs(a[0]))) print('mkdir: cannot create directory', 'err'); },
        touch(a) { const f = abs(a[0] || ''); if (!a[0]) return print('touch: missing file name', 'err'); if (!FS.exists(f) && !FS.write(f, '')) print('touch: cannot create file', 'err'); },
        rm(a) { if (!a[0] || !FS.rm(abs(a[0]))) print('rm: cannot remove: no such file or directory', 'err'); },
        mv(a) { if (a.length < 2 || !FS.rename(abs(a[0]), a[1])) print('mv: failed (usage: mv <path> <new name>)', 'err'); },
        echo(a) {
          const i = a.indexOf('>');
          if (i < 0) return print(a.join(' '));
          if (!a[i + 1] || !FS.write(abs(a[i + 1]), a.slice(0, i).join(' ') + '\n')) print('echo: cannot write file', 'err');
        },
        clear() { out.replaceChildren(); },
        date() { print(new Date().toString()); },
        whoami() { print(settings.user); },
        apps() { print(Object.keys(W11.Apps).join('  ')); },
        theme(a) { if (!['light', 'dark'].includes(a[0])) return print('usage: theme <light|dark>', 'err'); settings.theme = a[0]; W11.applySettings(); },
        open(a) {
          if (!a[0]) return print('usage: open <app|path>', 'err');
          if (W11.Apps[a[0]]) return W11.openApp(a[0]);
          const f = abs(a[0]); if (FS.exists(f)) return window.openPath(f);
          print('open: not found: ' + a[0], 'err');
        },
        neofetch() {
          [`${settings.user}@win11-web`, '------------------', 'OS: Win11 Web', 'Host: ' + (navigator.platform || 'browser'),
            'Shell: w11sh', 'Resolution: ' + innerWidth + 'x' + innerHeight, 'Theme: ' + settings.theme, 'Apps: ' + Object.keys(W11.Apps).length]
            .forEach(l => print(l, 'accent'));
        }
      };

      function run(text) {
        print(promptEl.textContent + text, 'cmd');
        const args = parse(text.trim()); if (!args.length) return;
        const name = args.shift();
        if (cmds[name]) { try { cmds[name](args); } catch (e) { print(String(e), 'err'); } }
        else print(`${name}: command not found. Type "help".`, 'err');
      }

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { const t = input.value; input.value = ''; if (t.trim()) { histI.push(t); hp = histI.length; } run(t); setPrompt(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (hp > 0) input.value = histI[--hp]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = hp < histI.length - 1 ? histI[++hp] : (hp = histI.length, ''); }
        else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); cmds.clear(); }
        else if (e.key === 'Tab') {
          e.preventDefault();
          const parts = input.value.split(' '), last = parts.pop(), base = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : '';
          const m = FS.list(abs(base || '.')).filter(i => i.name.startsWith(last.slice(base.length)));
          if (m.length === 1) input.value = [...parts, base + m[0].name + (m[0].type === 'dir' ? '/' : '')].join(' ');
        }
      });
      print('Win11 Web Terminal. Type "help" for commands.', 'accent');
      setPrompt(); input.focus();
    }
  });
})();

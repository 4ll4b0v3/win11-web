/* fs.js - tiny virtual file system persisted in localStorage */
(function (g) {
  'use strict';
  const W = g.W11;
  const KEY = 'fs';

  const defaults = () => ({
    type: 'dir', children: {
      Desktop: { type: 'dir', children: {} },
      Documents: {
        type: 'dir', children: {
          'Welcome.txt': { type: 'file', data: 'Welcome to Win11 Web!\n\nThis is a Windows 11-style desktop that runs entirely in your browser.\nFiles you save here live in your browser\'s localStorage.\n\nTry:\n  - Opening File Explorer and creating a folder\n  - Typing "help" in the Terminal\n  - Right-clicking the desktop to personalize it\n' }
        }
      },
      Downloads: { type: 'dir', children: {} },
      Pictures: { type: 'dir', children: {} },
      Music: { type: 'dir', children: {} },
      Videos: { type: 'dir', children: {} }
    }
  });

  let root = W.store.get(KEY, null) || defaults();
  const save = () => { W.store.set(KEY, root); W.bus.emit('fs'); };

  const parts = p => p.split('/').filter(Boolean);
  function norm(p) {
    const out = [];
    for (const s of String(p).split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') out.pop(); else out.push(s);
    }
    return '/' + out.join('/');
  }
  function node(p) {
    let n = root;
    for (const s of parts(norm(p))) {
      if (!n || n.type !== 'dir') return null;
      n = Object.prototype.hasOwnProperty.call(n.children, s) ? n.children[s] : null;
    }
    return n || null;
  }
  function split(p) {
    const ps = parts(norm(p)); const name = ps.pop();
    return { dir: node('/' + ps.join('/')), name, dirPath: '/' + ps.join('/') };
  }

  const FS = {
    norm,
    exists: p => !!node(p),
    isDir: p => { const n = node(p); return !!n && n.type === 'dir'; },
    list(p) {
      const n = node(p);
      if (!n || n.type !== 'dir') return [];
      return Object.entries(n.children).map(([name, c]) => ({
        name, type: c.type, size: c.type === 'file' ? (c.data || '').length : 0, path: norm(p + '/' + name)
      })).sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1));
    },
    read(p) { const n = node(p); return n && n.type === 'file' ? n.data : null; },
    write(p, data) {
      const s = split(p);
      if (!s.name || !s.dir || s.dir.type !== 'dir') return false;
      if (s.dir.children[s.name] && s.dir.children[s.name].type === 'dir') return false;
      s.dir.children[s.name] = { type: 'file', data: String(data) };
      save(); return true;
    },
    mkdir(p) {
      const s = split(p);
      if (!s.name || !s.dir || s.dir.type !== 'dir' || s.dir.children[s.name]) return false;
      s.dir.children[s.name] = { type: 'dir', children: {} };
      save(); return true;
    },
    rm(p) {
      const s = split(p);
      if (!s.name || !s.dir || !s.dir.children[s.name]) return false;
      delete s.dir.children[s.name];
      save(); return true;
    },
    rename(p, newName) {
      const s = split(p);
      if (!s.dir || !s.dir.children[s.name] || !newName || /[\/]/.test(newName) || s.dir.children[newName]) return false;
      s.dir.children[newName] = s.dir.children[s.name];
      delete s.dir.children[s.name];
      save(); return true;
    },
    /** "New folder", "New folder (2)", ... */
    unique(dirPath, base, ext = '') {
      let n = 1, name = base + ext;
      while (FS.exists(norm(dirPath + '/' + name))) name = `${base} (${++n})${ext}`;
      return name;
    },
    reset() { root = defaults(); save(); }
  };

  g.FS = FS;
})(window);

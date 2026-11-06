# Win11 Web

A Windows 11-style desktop that runs entirely in your browser. Plain HTML, CSS and JavaScript: no framework, no build step, no dependencies.

> This is an unofficial, educational look-alike. It is not affiliated with or endorsed by Microsoft, and all icons and artwork here are original.

## Features

- **Desktop shell**: boot screen, lock screen, wallpaper, desktop icons, right-click menu
- **Centered taskbar** with Start, Search, pinned apps, running-app indicators and a "show desktop" corner
- **Start menu** with pinned apps, recent files, live search across apps and files, and a power menu
- **Quick settings** (Wi-Fi/Bluetooth tiles, dark mode, brightness) and a **calendar flyout**
- **Window manager**: drag, resize from any edge, minimize, maximize, snap to left/right/top, `Alt+F4`
- **Light/dark mode**, accent colors and wallpapers, all saved between visits
- **Virtual file system** stored in `localStorage`

### Built-in apps

| App | What it does |
| --- | --- |
| File Explorer | Browse, create, rename and delete folders and files |
| Notepad | Edit and save text files to the virtual file system |
| Calculator | Standard calculator with keyboard support (no `eval`) |
| Terminal | `ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `mv`, `echo > file`, `open`, `theme`, `neofetch`, ... |
| Browser | Address bar and iframe (some sites block embedding; that is a web limit) |
| Paint | Brush, eraser, colors, PNG download |
| Settings | Personalization, display brightness, username, reset |

## Run it

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, pick `main` and `/ (root)`.
3. Your desktop will be live at `https://<user>.github.io/<repo>/`.

## Project structure

```
index.html          page skeleton
css/style.css       all styling (light/dark via CSS variables)
js/icons.js         inline SVG icon set
js/core.js          helpers, settings, menus, dialogs, window manager
js/fs.js            virtual file system
js/shell.js         desktop, taskbar, Start menu, flyouts, lock screen
js/apps/*.js        one file per app
```

## Adding an app

Create `js/apps/myapp.js`, add a `<script>` tag in `index.html`, and register it:

```js
W11.registerApp({
  id: 'hello', name: 'Hello', icon: 'file', w: 400, h: 300,
  create(win, args) {
    win.body.append(W11.h('div', { style: { padding: '16px' } }, 'Hello from a new app!'));
  }
});
```

Then add its id to `pinnedIds` (Start menu) or `taskbarIds` (taskbar) in `js/shell.js`.

## Roadmap ideas

- Widgets panel and notification center
- Task View / virtual desktops
- Image viewer, media player, Snipping tool
- Drag-and-drop files between folders and onto the desktop
- Window snap layouts (quarters, thirds)

## License

MIT, see [LICENSE](LICENSE).

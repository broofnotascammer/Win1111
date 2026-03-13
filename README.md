# 🖥️ BrowserOS

A full **Windows 11 simulation** running entirely in your browser — no server, no backend, no install required.

![BrowserOS](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![PWA](https://img.shields.io/badge/PWA-ready-purple)

---

## ✨ Features

### 🗂️ Virtual Filesystem (IndexedDB)
- Persistent file storage — files survive page refreshes
- Real folder structure: `/Users/User/Documents`, `/Downloads`, `/Pictures`, etc.
- Drag & drop file upload from your real computer
- Download any file back to your real device
- Full CRUD: create, rename, delete, copy, move

### 🪟 Window Manager
- Drag, resize, minimize, maximize every window
- Z-ordering with proper focus management
- Snap layout foundation

### 📱 Apps
| App | Features |
|-----|----------|
| 📂 **File Explorer** | Sidebar, grid/list view, address bar, context menus, upload, download |
| 📝 **Notepad** | Open/save files from FS, word wrap, font control, find, keyboard shortcuts |
| ⬛ **Terminal** | `ls`, `cd`, `mkdir`, `cat`, `rm`, `mv`, `cp`, `find`, `neofetch`, tab autocomplete |
| 🧮 **Calculator** | Full arithmetic, keyboard support, history |
| 🎨 **Paint** | Brush, eraser, line, rect, circle, fill tool, color palette, save to FS |
| 🌐 **Browser** | iframe-based web browser with bookmarks, back/forward, URL bar |
| 🎬 **Media Player** | Play audio & video from filesystem, playlist support, progress bar |
| ⚙️ **Settings** | Wallpaper, accent color, brightness, accounts, storage info |
| 🛍️ **Store** | Launch popular web apps (Spotify, GitHub, Notion, Figma…) |
| 📊 **System Monitor** | Live CPU/RAM charts, window count (extension) |
| 🕐 **Clock Widget** | Desktop clock with seconds ring (extension) |

### 🎨 Design
- Windows 11 Fluent Design — Mica blur, rounded corners
- 6 wallpaper themes (Blue, Sunset, Forest, Night Sky, Aurora, Galaxy)
- 8 accent colors
- Brightness & volume sliders in Action Center
- Lock screen with live clock

### 🔌 Extension API
Register custom apps and system tray icons:

```js
BrowserOSExtensions.register('my-app', {
  name: 'My App',
  icon: '🚀',
  app: {
    launch(container, winState) {
      container.innerHTML = '<h1>Hello BrowserOS!</h1>';
    }
  },
  onActivate(ctx) {
    ctx.notify('Activated', 'My app is running!');
  }
});
```

---

## 🚀 Getting Started

### Option 1 — GitHub Pages (recommended)
1. Fork this repo
2. Go to **Settings → Pages**
3. Set source: `main` branch, `/ (root)`
4. Visit `https://yourusername.github.io/BrowserOS`

### Option 2 — Run locally
```bash
git clone https://github.com/yourusername/BrowserOS.git
cd BrowserOS
# Open index.html directly OR use a local server:
npx serve .
# or
python -m http.server 8080
```

> ⚠️ Some features (IndexedDB) require a proper HTTP origin. Use a local server rather than `file://`.

---

## 📁 Project Structure

```
BrowserOS/
├── index.html               # Main entry point
├── manifest.json            # PWA manifest
├── css/
│   ├── system.css           # Core OS styles
│   └── boot.css             # Boot, lock screen, app styles
├── js/
│   ├── kernel.js            # App registry, event bus, notifications
│   ├── filesystem.js        # IndexedDB virtual filesystem
│   ├── windowmanager.js     # Window creation, drag, resize
│   ├── desktop.js           # Desktop icons, wallpaper, right-click
│   ├── taskbar.js           # Taskbar, Start Menu, Action Center, Search
│   ├── boot.js              # Boot sequence
│   ├── apps/
│   │   ├── fileexplorer.js
│   │   ├── notepad.js
│   │   ├── terminal.js
│   │   ├── calculator.js    # (also contains Paint, Browser, Media Player)
│   │   ├── settings.js
│   │   └── store.js
│   └── extensions/
│       └── extension-api.js # Extension system + built-in extensions
└── assets/                  # Icons and wallpapers (optional)
```

---

## 🗺️ Roadmap

- [ ] macOS theme (coming soon)
- [ ] Linux / Ubuntu theme
- [ ] Multi-user accounts
- [ ] WebRTC file sharing between BrowserOS sessions
- [ ] More apps: Spreadsheet, Presentation, Code Editor
- [ ] App packaging format (`.bapp`)
- [ ] Real EXE resource extractor (PE parser in WASM)
- [ ] Touch / mobile support

---

## 🤝 Contributing

PRs welcome! Open an issue first for large changes.

---

## 📄 License

MIT © BrowserOS Contributors

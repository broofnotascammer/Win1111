/**
 * BrowserOS Desktop
 * Desktop icons, wallpaper management, right-click menus
 */

window.Desktop = (function() {
  'use strict';

  const wallpapers = [
    { id: 'default', label: 'Windows Blue', style: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 30%, #0d5bb5 60%, #1e90d4 100%)' },
    { id: 'sunset', label: 'Sunset', style: 'linear-gradient(160deg, #1a0533 0%, #6b1a5e 40%, #d4506b 70%, #f4a261 100%)' },
    { id: 'forest', label: 'Forest', style: 'linear-gradient(160deg, #0d1f0d 0%, #1b4d1b 40%, #2d7d2d 70%, #4caf50 100%)' },
    { id: 'night', label: 'Night Sky', style: 'linear-gradient(160deg, #030714 0%, #0a0f2e 40%, #12184a 70%, #1e2a6b 100%)' },
    { id: 'aurora', label: 'Aurora', style: 'linear-gradient(160deg, #030f1a 0%, #0a3040 30%, #0d7a6b 60%, #12c4a0 85%, #82e8d4 100%)' },
    { id: 'purple', label: 'Galaxy', style: 'linear-gradient(160deg, #0f0020 0%, #2d0057 40%, #6b0099 70%, #a000cc 100%)' },
  ];

  function init() {
    renderWallpaper();
    renderDesktopIcons();
    setupDesktopContextMenu();
    OS.on('fs:change', () => renderDesktopIcons());
    OS.on('setting:wallpaper', renderWallpaper);
  }

  function renderWallpaper() {
    const id = OS.getSetting('wallpaper') || 'default';
    const wp = wallpapers.find(w => w.id === id) || wallpapers[0];
    document.getElementById('wallpaper').style.background = wp.style;
  }

  async function renderDesktopIcons() {
    const container = document.getElementById('desktop-icons');
    container.innerHTML = '';

    // Static icons
    const staticIcons = [
      { name: 'This PC', icon: '💻', action: () => WM.launch('fileexplorer') },
      { name: 'Recycle Bin', icon: '🗑️', action: () => WM.launch('fileexplorer', { path: '/Recycle Bin' }) },
    ];

    staticIcons.forEach(item => {
      const el = createDesktopIcon(item.name, item.icon);
      el.addEventListener('dblclick', item.action);
      container.appendChild(el);
    });

    // Files on desktop from FS
    try {
      const desktopFiles = await FS.readDir('/Users/User/Desktop');
      desktopFiles.forEach(entry => {
        const el = createDesktopIcon(entry.name, FS.getFileIcon(entry));
        el.dataset.path = entry.path;
        el.addEventListener('dblclick', () => OS.openFile(entry));
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showFileCtx(e, entry);
        });
        container.appendChild(el);
      });
    } catch(e) { /* no desktop dir yet */ }
  }

  function createDesktopIcon(name, icon) {
    const el = document.createElement('div');
    el.className = 'desktop-icon';
    el.innerHTML = `
      <div class="desktop-icon-img">${icon}</div>
      <div class="desktop-icon-name">${name}</div>
    `;
    el.addEventListener('click', (e) => {
      document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
    });
    return el;
  }

  function setupDesktopContextMenu() {
    document.getElementById('desktop').addEventListener('contextmenu', (e) => {
      if (e.target.closest('.window') || e.target.closest('#taskbar') ||
          e.target.closest('.desktop-icon')) return;
      e.preventDefault();

      const items = [
        { label: 'New folder', icon: '📁', action: () => createFolder() },
        { label: 'New text file', icon: '📄', action: () => createTextFile() },
        { separator: true },
        { label: 'Change wallpaper', icon: '🖼️', action: () => WM.launch('settings', { page: 'personalization' }) },
        { separator: true },
        { label: 'Refresh', icon: '🔄', action: () => renderDesktopIcons() },
        { label: 'Open Terminal', icon: '⬛', action: () => WM.launch('terminal') },
        { label: 'Open File Explorer', icon: '📂', action: () => WM.launch('fileexplorer') },
      ];

      WM.showContextMenu(e.clientX, e.clientY, items);
    });

    // Deselect on click
    document.getElementById('desktop').addEventListener('mousedown', (e) => {
      if (!e.target.closest('.desktop-icon')) {
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
      }
    });
  }

  function showFileCtx(e, entry) {
    const items = [
      { label: 'Open', icon: '▶️', action: () => OS.openFile(entry) },
      { separator: true },
      { label: 'Copy', icon: '📋', action: () => OS.setClipboard({ type: 'copy', entry }) },
      { label: 'Cut', icon: '✂️', action: () => OS.setClipboard({ type: 'cut', entry }) },
      { separator: true },
      { label: 'Rename', icon: '✏️', action: () => renameFile(entry) },
      { label: 'Delete', icon: '🗑️', action: () => deleteFile(entry), danger: true },
      { separator: true },
      { label: 'Properties', icon: 'ℹ️', action: () => showProperties(entry) },
    ];
    WM.showContextMenu(e.clientX, e.clientY, items);
  }

  async function createFolder() {
    const name = prompt('Folder name:');
    if (!name) return;
    await FS.mkdir('/Users/User/Desktop/' + name);
    renderDesktopIcons();
  }

  async function createTextFile() {
    const name = prompt('File name:', 'New Text Document.txt');
    if (!name) return;
    const blob = new Blob([''], { type: 'text/plain' });
    await FS.writeFile('/Users/User/Desktop/' + name, blob);
    renderDesktopIcons();
  }

  async function renameFile(entry) {
    const name = prompt('New name:', entry.name);
    if (!name || name === entry.name) return;
    await FS.rename(entry.path, FS.dirname(entry.path) + '/' + name);
    renderDesktopIcons();
  }

  async function deleteFile(entry) {
    if (!confirm('Delete ' + entry.name + '?')) return;
    await FS.deleteEntry(entry.path);
    renderDesktopIcons();
  }

  function showProperties(entry) {
    WM.launch('notepad', {
      title: 'Properties: ' + entry.name,
      content: `Name: ${entry.name}
Type: ${entry.type}
Path: ${entry.path}
Size: ${FS.formatSize(entry.size || 0)}
Created: ${new Date(entry.created).toLocaleString()}
Modified: ${new Date(entry.modified).toLocaleString()}
MIME: ${entry.mime || 'N/A'}`,
      readOnly: true,
      width: 380,
      height: 260,
    });
  }

  function getWallpapers() { return wallpapers; }

  return { init, renderDesktopIcons, renderWallpaper, getWallpapers };
})();

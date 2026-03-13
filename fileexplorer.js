/**
 * BrowserOS - File Explorer
 */

OS.registerApp('fileexplorer', {
  name: 'File Explorer',
  icon: '📂',
  category: 'System',
  pinned: true,
  pinnedTaskbar: true,
  defaultWidth: 900,
  defaultHeight: 580,
  minWidth: 500,
  minHeight: 320,
  keywords: ['files', 'folder', 'explorer', 'browse', 'documents'],
  launch(container, winState, opts) {
    let currentPath = opts?.path || '/Users/User';
    let history = [currentPath];
    let histIdx = 0;
    let selectedEntry = null;
    let viewMode = 'grid'; // grid | list
    let sortBy = 'name';
    let clipboard = null;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div class="app-toolbar">
          <button id="fe-back-${winState.id}" class="fe-btn" title="Back">◀</button>
          <button id="fe-fwd-${winState.id}" class="fe-btn" title="Forward">▶</button>
          <button id="fe-up-${winState.id}" class="fe-btn" title="Up">⬆</button>
          <button id="fe-refresh-${winState.id}" class="fe-btn" title="Refresh">🔄</button>
          <div class="separator"></div>
          <input class="fe-path" id="fe-path-${winState.id}" value="${currentPath}">
          <div class="separator"></div>
          <button id="fe-new-folder-${winState.id}" title="New folder">📁 New</button>
          <button id="fe-upload-${winState.id}" title="Upload file">📤 Upload</button>
          <button id="fe-view-${winState.id}" title="Toggle view">⊞</button>
          <input type="file" id="fe-file-input-${winState.id}" multiple style="display:none">
        </div>
        <div class="fe-layout" style="flex:1;overflow:hidden">
          <div class="fe-sidebar" id="fe-sidebar-${winState.id}"></div>
          <div class="fe-main" id="fe-main-${winState.id}">
            <div class="fe-grid" id="fe-grid-${winState.id}"></div>
          </div>
        </div>
        <div style="height:24px;background:var(--bg-elevated);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 12px;font-size:11px;color:var(--text-secondary)">
          <span id="fe-status-${winState.id}">Ready</span>
        </div>
      </div>
    `;

    const id = winState.id;
    const backBtn = document.getElementById(`fe-back-${id}`);
    const fwdBtn = document.getElementById(`fe-fwd-${id}`);
    const upBtn = document.getElementById(`fe-up-${id}`);
    const refreshBtn = document.getElementById(`fe-refresh-${id}`);
    const pathInput = document.getElementById(`fe-path-${id}`);
    const newFolderBtn = document.getElementById(`fe-new-folder-${id}`);
    const uploadBtn = document.getElementById(`fe-upload-${id}`);
    const viewBtn = document.getElementById(`fe-view-${id}`);
    const fileInput = document.getElementById(`fe-file-input-${id}`);
    const grid = document.getElementById(`fe-grid-${id}`);
    const sidebar = document.getElementById(`fe-sidebar-${id}`);
    const status = document.getElementById(`fe-status-${id}`);

    // Sidebar
    const sidebarItems = [
      { label: 'Desktop', icon: '🖥️', path: '/Users/User/Desktop' },
      { label: 'Documents', icon: '📄', path: '/Users/User/Documents' },
      { label: 'Downloads', icon: '📥', path: '/Users/User/Downloads' },
      { label: 'Pictures', icon: '🖼️', path: '/Users/User/Pictures' },
      { label: 'Music', icon: '🎵', path: '/Users/User/Music' },
      { label: 'Videos', icon: '🎬', path: '/Users/User/Videos' },
      null,
      { label: 'This PC', icon: '💻', path: '/Users/User' },
      { label: 'Program Files', icon: '⚙️', path: '/Program Files' },
    ];

    sidebar.innerHTML = sidebarItems.map(item => {
      if (!item) return '<div class="fe-sidebar-section">DRIVES</div>';
      return `<div class="fe-sidebar-item" data-path="${item.path}">
        <span class="fe-sidebar-icon">${item.icon}</span>
        <span>${item.label}</span>
      </div>`;
    }).join('');

    sidebar.querySelectorAll('.fe-sidebar-item').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.path));
    });

    // Navigation
    function navigate(path) {
      history = history.slice(0, histIdx + 1);
      history.push(path);
      histIdx = history.length - 1;
      currentPath = path;
      load();
    }

    backBtn.addEventListener('click', () => {
      if (histIdx > 0) { histIdx--; currentPath = history[histIdx]; load(); }
    });

    fwdBtn.addEventListener('click', () => {
      if (histIdx < history.length - 1) { histIdx++; currentPath = history[histIdx]; load(); }
    });

    upBtn.addEventListener('click', () => {
      const parent = FS.dirname(currentPath);
      if (parent !== currentPath) navigate(parent);
    });

    refreshBtn.addEventListener('click', () => load());

    pathInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') navigate(pathInput.value.trim());
    });

    // New Folder
    newFolderBtn.addEventListener('click', async () => {
      const name = prompt('Folder name:');
      if (!name) return;
      await FS.mkdir(currentPath + '/' + name);
      load();
    });

    // Upload
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      for (const file of fileInput.files) {
        await FS.importFile(file, currentPath);
      }
      fileInput.value = '';
      load();
      OS.notify('File Explorer', `${fileInput.files?.length || 1} file(s) uploaded`);
    });

    viewBtn.addEventListener('click', () => {
      viewMode = viewMode === 'grid' ? 'list' : 'grid';
      load();
    });

    // Drag & Drop upload
    const main = document.getElementById(`fe-main-${id}`);
    main.addEventListener('dragover', (e) => { e.preventDefault(); main.style.background = 'rgba(0,120,212,0.1)'; });
    main.addEventListener('dragleave', () => main.style.background = '');
    main.addEventListener('drop', async (e) => {
      e.preventDefault();
      main.style.background = '';
      for (const file of e.dataTransfer.files) {
        await FS.importFile(file, currentPath);
      }
      load();
    });

    // Load directory
    async function load() {
      pathInput.value = currentPath;
      sidebar.querySelectorAll('.fe-sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.path === currentPath);
      });

      try {
        let entries = await FS.readDir(currentPath);

        // Sort
        entries.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        if (viewMode === 'grid') {
          grid.className = 'fe-grid';
          grid.innerHTML = entries.map(e => `
            <div class="fe-item" data-path="${e.path}" data-type="${e.type}" title="${e.name}">
              <div class="fe-item-icon">${FS.getFileIcon(e)}</div>
              <div class="fe-item-name">${e.name}</div>
            </div>
          `).join('') || '<div style="color:var(--text-disabled);font-size:13px;padding:24px">This folder is empty</div>';
        } else {
          grid.className = '';
          grid.style.width = '100%';
          grid.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 80px 120px 120px;font-size:11px;color:var(--text-disabled);padding:4px 8px;border-bottom:1px solid var(--border)">
              <span>Name</span><span>Type</span><span>Size</span><span>Modified</span>
            </div>
          ` + entries.map(e => `
            <div class="fe-item" style="flex-direction:row;width:100%;border-radius:4px;padding:4px 8px;display:grid;grid-template-columns:1fr 80px 120px 120px;align-items:center;gap:8px" data-path="${e.path}" data-type="${e.type}">
              <div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${FS.getFileIcon(e)}</span><span style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name}</span></div>
              <span style="font-size:11px;color:var(--text-secondary)">${e.type === 'directory' ? 'Folder' : (FS.extname(e.name).toUpperCase() || 'File')}</span>
              <span style="font-size:11px;color:var(--text-secondary)">${e.type === 'file' ? FS.formatSize(e.size || 0) : ''}</span>
              <span style="font-size:11px;color:var(--text-secondary)">${new Date(e.modified || 0).toLocaleDateString()}</span>
            </div>
          `).join('');
        }

        status.textContent = `${entries.length} item${entries.length !== 1 ? 's' : ''}`;

        // Double-click
        grid.querySelectorAll('.fe-item').forEach(el => {
          el.addEventListener('click', () => {
            grid.querySelectorAll('.fe-item.selected').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
          });

          el.addEventListener('dblclick', async () => {
            const entry = await FS.stat(el.dataset.path);
            if (!entry) return;
            if (entry.type === 'directory') {
              navigate(entry.path);
            } else {
              OS.openFile(entry);
              Taskbar.addRecentFile(entry);
            }
          });

          el.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            const entry = await FS.stat(el.dataset.path);
            if (!entry) return;
            selectedEntry = entry;
            showItemCtx(e, entry);
          });
        });

      } catch(err) {
        grid.innerHTML = `<div style="color:#f48771;font-size:13px;padding:24px">Cannot open: ${currentPath}</div>`;
      }

      backBtn.style.opacity = histIdx > 0 ? '1' : '0.4';
      fwdBtn.style.opacity = histIdx < history.length - 1 ? '1' : '0.4';
    }

    function showItemCtx(e, entry) {
      WM.showContextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: '▶️', action: () => {
          if (entry.type === 'directory') navigate(entry.path);
          else { OS.openFile(entry); Taskbar.addRecentFile(entry); }
        }},
        { label: 'Open with Notepad', icon: '📝', action: () => WM.launch('notepad', { file: entry }) },
        { separator: true },
        { label: 'Copy', icon: '📋', action: () => OS.setClipboard({ type: 'copy', entry }) },
        { label: 'Cut', icon: '✂️', action: () => OS.setClipboard({ type: 'cut', entry }) },
        { label: 'Paste', icon: '📌', action: async () => {
          const cb = OS.getClipboard();
          if (!cb) return;
          await FS.copy(cb.entry.path, currentPath + '/' + cb.entry.name);
          if (cb.type === 'cut') await FS.deleteEntry(cb.entry.path);
          load();
        }},
        { separator: true },
        { label: 'Rename', icon: '✏️', action: async () => {
          const name = prompt('New name:', entry.name);
          if (!name || name === entry.name) return;
          await FS.rename(entry.path, FS.dirname(entry.path) + '/' + name);
          load();
        }},
        { label: 'Delete', icon: '🗑️', danger: true, action: async () => {
          if (confirm('Delete "' + entry.name + '"?')) {
            await FS.deleteEntry(entry.path);
            load();
          }
        }},
        { separator: true },
        { label: 'Download', icon: '💾', action: async () => {
          if (entry.type === 'file') {
            const blob = await FS.readFile(entry.path);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = entry.name; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }},
        { label: 'Properties', icon: 'ℹ️', action: () => {
          alert(`Name: ${entry.name}\nPath: ${entry.path}\nType: ${entry.type}\nSize: ${FS.formatSize(entry.size || 0)}\nModified: ${new Date(entry.modified).toLocaleString()}`);
        }},
      ]);
    }

    // FS change listener
    const unsubscribe = OS.on('fs:change', () => load());
    winState._cleanup = unsubscribe;

    load();
  },
});

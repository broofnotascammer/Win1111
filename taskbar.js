/**
 * BrowserOS Taskbar & Start Menu
 */

window.Taskbar = (function() {
  'use strict';

  function init() {
    initClock();
    initStartMenu();
    initActionCenter();
    initSearch();
    initPinnedApps();
    initTaskView();
    initSystemTray();
  }

  // ===== Clock =====
  function initClock() {
    function update() {
      const now = new Date();
      const timeEl = document.getElementById('clock-time');
      const dateEl = document.getElementById('clock-date');
      if (!timeEl) return;
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      dateEl.textContent = now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });

      // Lock screen clock
      const lt = document.getElementById('lock-time');
      const ld = document.getElementById('lock-date');
      if (lt) lt.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (ld) ld.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
    update();
    setInterval(update, 10000);
  }

  // ===== Start Menu =====
  function initStartMenu() {
    const btn = document.getElementById('start-btn');
    const menu = document.getElementById('start-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const visible = menu.style.display !== 'none';
      menu.style.display = visible ? 'none' : 'flex';
      menu.style.flexDirection = 'column';
      document.getElementById('all-apps-menu').style.display = 'none';
      if (!visible) {
        renderStartMenu();
        setTimeout(() => document.getElementById('start-search-input').focus(), 50);
      }
    });

    // All apps
    document.getElementById('all-apps-btn').addEventListener('click', () => {
      document.getElementById('start-menu').style.display = 'none';
      document.getElementById('all-apps-menu').style.display = 'flex';
      document.getElementById('all-apps-menu').style.flexDirection = 'column';
      renderAllApps();
    });

    document.getElementById('back-to-start-btn').addEventListener('click', () => {
      document.getElementById('all-apps-menu').style.display = 'none';
      document.getElementById('start-menu').style.display = 'flex';
      document.getElementById('start-menu').style.flexDirection = 'column';
    });

    // Search in start menu
    document.getElementById('start-search-input').addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q) {
        renderStartSearchResults(q);
      } else {
        renderStartMenu();
      }
    });

    // Power button
    document.getElementById('power-btn').addEventListener('click', () => {
      showPowerMenu();
    });
  }

  function renderStartMenu() {
    // Pinned apps
    const pinned = OS.getAllApps().filter(a => a.pinned);
    document.getElementById('start-pinned-grid').innerHTML = pinned.slice(0, 18).map(app => `
      <div class="start-app-item" data-appid="${app.id}" title="${app.name}">
        <div class="start-app-icon">${app.icon}</div>
        <div class="start-app-name">${app.name}</div>
      </div>
    `).join('');

    document.querySelectorAll('#start-pinned-grid .start-app-item').forEach(el => {
      el.addEventListener('click', () => {
        WM.launch(el.dataset.appid);
        document.getElementById('start-menu').style.display = 'none';
      });
    });

    // Recommended (recent files)
    const recs = getRecentFiles();
    document.getElementById('start-recommended-list').innerHTML = recs.slice(0, 6).map(r => `
      <div class="start-rec-item" data-path="${r.path}">
        <div class="start-rec-icon">${r.icon}</div>
        <div>
          <div class="start-rec-name">${r.name}</div>
          <div class="start-rec-time">${r.time}</div>
        </div>
      </div>
    `).join('') || '<div style="font-size:12px;color:var(--text-disabled);padding:8px">No recent files</div>';

    document.querySelectorAll('.start-rec-item').forEach(el => {
      el.addEventListener('click', async () => {
        const entry = await FS.stat(el.dataset.path);
        if (entry) OS.openFile(entry);
        document.getElementById('start-menu').style.display = 'none';
      });
    });

    document.getElementById('start-username') && (document.getElementById('start-username').textContent = OS.getSetting('username') || 'User');
  }

  function renderStartSearchResults(q) {
    const apps = OS.search(q);
    document.getElementById('start-pinned-grid').innerHTML = apps.slice(0, 12).map(app => `
      <div class="start-app-item" data-appid="${app.id}">
        <div class="start-app-icon">${app.icon}</div>
        <div class="start-app-name">${app.name}</div>
      </div>
    `).join('') || '<div style="padding:20px;color:var(--text-disabled);font-size:12px;grid-column:span 6;text-align:center">No results</div>';

    document.querySelectorAll('#start-pinned-grid .start-app-item').forEach(el => {
      el.addEventListener('click', () => {
        WM.launch(el.dataset.appid);
        document.getElementById('start-menu').style.display = 'none';
      });
    });
  }

  function renderAllApps() {
    const apps = OS.getAllApps();
    // Group by first letter
    const grouped = {};
    apps.forEach(app => {
      const letter = app.name[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(app);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(letter => {
      html += `<div style="font-size:11px;color:var(--text-disabled);padding:8px 10px 4px;font-weight:600">${letter}</div>`;
      html += grouped[letter].map(app => `
        <div class="all-app-row" data-appid="${app.id}">
          <span class="all-app-icon">${app.icon}</span>
          <span>${app.name}</span>
        </div>
      `).join('');
    });

    document.getElementById('all-apps-list').innerHTML = html;
    document.querySelectorAll('.all-app-row').forEach(el => {
      el.addEventListener('click', () => {
        WM.launch(el.dataset.appid);
        document.getElementById('all-apps-menu').style.display = 'none';
      });
    });
  }

  function getRecentFiles() {
    try {
      const raw = localStorage.getItem('os_recent_files');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function addRecentFile(entry) {
    let recent = getRecentFiles();
    recent = recent.filter(r => r.path !== entry.path);
    recent.unshift({
      path: entry.path,
      name: entry.name,
      icon: FS.getFileIcon(entry),
      time: 'Just now',
    });
    localStorage.setItem('os_recent_files', JSON.stringify(recent.slice(0, 20)));
  }

  // ===== Action Center =====
  function initActionCenter() {
    document.getElementById('action-center-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const ac = document.getElementById('action-center');
      ac.style.display = ac.style.display === 'none' ? 'block' : 'none';
      if (ac.style.display === 'block') {
        renderActionCenter();
        OS.renderNotifBell();
      }
    });

    // Sliders
    document.getElementById('volume-slider').addEventListener('input', (e) => {
      OS.setSetting('volume', e.target.value);
      document.getElementById('volume-val').textContent = e.target.value;
    });

    document.getElementById('brightness-slider').addEventListener('input', (e) => {
      OS.setSetting('brightness', e.target.value);
      document.getElementById('brightness-val').textContent = e.target.value;
      document.getElementById('wallpaper').style.filter = `brightness(${e.target.value / 100})`;
    });
  }

  function renderActionCenter() {
    const tiles = [
      { id: 'wifi', icon: '📶', label: 'Wi-Fi', on: true },
      { id: 'bluetooth', icon: '🔷', label: 'Bluetooth', on: false },
      { id: 'airplane', icon: '✈️', label: 'Airplane', on: false },
      { id: 'dnd', icon: '🔕', label: 'Focus', on: false },
      { id: 'nightlight', icon: '🌙', label: 'Night light', on: false },
      { id: 'cast', icon: '📡', label: 'Cast', on: false },
      { id: 'screenshot', icon: '📸', label: 'Snip', on: false },
      { id: 'settings', icon: '⚙️', label: 'Settings', on: false, action: () => WM.launch('settings') },
    ];

    const states = {};
    document.getElementById('ac-tiles').innerHTML = tiles.map(t => `
      <div class="ac-tile ${states[t.id] || t.on ? 'active' : ''}" data-id="${t.id}" title="${t.label}">
        <div class="ac-tile-icon">${t.icon}</div>
        <div class="ac-tile-name">${t.label}</div>
      </div>
    `).join('');

    document.querySelectorAll('.ac-tile').forEach((el, i) => {
      el.addEventListener('click', () => {
        if (tiles[i].action) {
          tiles[i].action();
          document.getElementById('action-center').style.display = 'none';
        } else {
          el.classList.toggle('active');
        }
      });
    });

    // Restore slider values
    document.getElementById('volume-slider').value = OS.getSetting('volume') || 75;
    document.getElementById('volume-val').textContent = OS.getSetting('volume') || 75;
    document.getElementById('brightness-slider').value = OS.getSetting('brightness') || 85;
    document.getElementById('brightness-val').textContent = OS.getSetting('brightness') || 85;

    OS.renderNotifBell();
  }

  // ===== Search =====
  function initSearch() {
    document.getElementById('search-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const overlay = document.getElementById('search-overlay');
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
      if (overlay.style.display === 'block') {
        document.getElementById('search-input').focus();
      }
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      const q = e.target.value.trim();
      renderSearchResults(q);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('search-overlay').style.display = 'none';
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('all-apps-menu').style.display = 'none';
        document.getElementById('action-center').style.display = 'none';
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-overlay').style.display = 'block';
        document.getElementById('search-input').focus();
      }
    });
  }

  async function renderSearchResults(q) {
    const resultsEl = document.getElementById('search-results');
    if (!q) { resultsEl.innerHTML = ''; return; }

    const apps = OS.search(q);
    const files = await FS.search(q);

    let html = '';

    if (apps.length > 0) {
      html += `<div style="font-size:11px;color:var(--text-disabled);padding:4px 12px;font-weight:600">APPS</div>`;
      html += apps.slice(0, 5).map(app => `
        <div class="search-result-item" data-type="app" data-id="${app.id}">
          <span class="search-result-icon">${app.icon}</span>
          <div>
            <div style="font-size:13px">${app.name}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${app.category}</div>
          </div>
        </div>
      `).join('');
    }

    if (files.length > 0) {
      html += `<div style="font-size:11px;color:var(--text-disabled);padding:4px 12px;font-weight:600;margin-top:8px">FILES</div>`;
      html += files.slice(0, 5).map(f => `
        <div class="search-result-item" data-type="file" data-path="${f.path}">
          <span class="search-result-icon">${FS.getFileIcon(f)}</span>
          <div>
            <div style="font-size:13px">${f.name}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${f.path}</div>
          </div>
        </div>
      `).join('');
    }

    if (!html) html = '<div style="color:var(--text-disabled);font-size:13px;padding:20px;text-align:center">No results found</div>';

    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', async () => {
        document.getElementById('search-overlay').style.display = 'none';
        document.getElementById('search-input').value = '';

        if (el.dataset.type === 'app') {
          WM.launch(el.dataset.id);
        } else {
          const entry = await FS.stat(el.dataset.path);
          if (entry) OS.openFile(entry);
        }
      });
    });
  }

  // ===== Pinned Apps on Taskbar =====
  function initPinnedApps() {
    const pinnedIds = ['fileexplorer', 'browser', 'terminal', 'notepad', 'mediaplayer', 'store', 'settings'];
    const center = document.getElementById('taskbar-center');

    pinnedIds.forEach(id => {
      const app = OS.getApp(id);
      if (!app) return;
      const btn = document.createElement('button');
      btn.className = 'taskbar-app-btn';
      btn.dataset.appid = id;
      btn.dataset.pinned = 'true';
      btn.title = app.name;
      btn.innerHTML = `<span class="app-icon">${app.icon}</span>`;
      btn.addEventListener('click', () => {
        // Find open window for this app
        let found = null;
        WM.getWindows().forEach((state, winId) => {
          if (state.appId === id) found = winId;
        });
        if (found) {
          const state = WM.getWindows().get(found);
          if (state.minimized) WM.restoreWindow(found);
          else if (WM.getActiveId() === found) WM.minimizeWindow(found);
          else WM.focusWindow(found);
        } else {
          WM.launch(id);
        }
      });
      center.appendChild(btn);
    });
  }

  // ===== Task View =====
  function initTaskView() {
    document.getElementById('taskview-btn').addEventListener('click', () => {
      // Simple: show all windows
      const wins = WM.getWindows();
      if (wins.size === 0) { OS.notify('Task View', 'No open windows'); return; }
      wins.forEach((state, id) => {
        if (state.minimized) WM.restoreWindow(id);
      });
    });
  }

  // ===== System Tray =====
  function initSystemTray() {
    // Volume btn  
    document.getElementById('volume-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('action-center').style.display =
        document.getElementById('action-center').style.display === 'none' ? 'block' : 'none';
      if (document.getElementById('action-center').style.display === 'block') renderActionCenter();
    });
  }

  // ===== Power Menu =====
  function showPowerMenu() {
    WM.showContextMenu(
      window.innerWidth / 2,
      window.innerHeight - 80,
      [
        { label: 'Sleep', icon: '💤', action: () => {} },
        { label: 'Restart', icon: '🔄', action: () => { if (confirm('Restart BrowserOS?')) location.reload(); } },
        { label: 'Shut down', icon: '⏻', action: () => { document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif">Shutting down...</div>'; } },
      ]
    );
  }

  return { init, addRecentFile };
})();

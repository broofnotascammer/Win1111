/**
 * BrowserOS Window Manager
 * Handles window creation, dragging, resizing, z-order, snap layouts
 */

window.WM = (function() {
  'use strict';

  const windows = new Map(); // id -> windowState
  let zCounter = 200;
  let activeWindowId = null;

  // ===== Create Window =====
  function createWindow(appId, opts = {}) {
    const app = OS.getApp(appId);
    if (!app) { console.warn('Unknown app:', appId); return null; }

    const id = 'win_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const container = document.getElementById('window-container');

    const vw = window.innerWidth;
    const vh = window.innerHeight - 48; // minus taskbar

    const w = opts.width || app.defaultWidth;
    const h = opts.height || app.defaultHeight;
    const x = opts.x !== undefined ? opts.x : Math.max(0, (vw - w) / 2 + (windows.size * 20));
    const y = opts.y !== undefined ? opts.y : Math.max(0, (vh - h) / 2 + (windows.size * 20));

    const state = {
      id, appId,
      x, y, w, h,
      minimized: false,
      maximized: false,
      _prevBounds: null,
      zIndex: ++zCounter,
      title: opts.title || app.name,
      opts,
    };

    windows.set(id, state);

    const el = document.createElement('div');
    el.className = 'window focused';
    el.id = id;
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${state.zIndex}`;

    el.innerHTML = `
      ${resizeHandles()}
      <div class="window-titlebar" data-winid="${id}">
        <span class="window-icon">${app.icon}</span>
        <span class="window-title">${state.title}</span>
        <div class="window-controls">
          <button class="wc-btn minimize" title="Minimize" data-action="minimize" data-winid="${id}">
            <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button class="wc-btn maximize" title="Maximize" data-action="maximize" data-winid="${id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="0.5" width="9" height="9"/></svg>
          </button>
          <button class="wc-btn close" title="Close" data-action="close" data-winid="${id}">
            <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.2"><line x1="0" y1="0" x2="10" y2="10"/><line x1="10" y1="0" x2="0" y2="10"/></svg>
          </button>
        </div>
      </div>
      <div class="window-body" id="body_${id}"></div>
    `;

    container.appendChild(el);

    // Render app content
    const body = document.getElementById('body_' + id);
    app.launch(body, state, opts);

    // Focus
    focusWindow(id);

    // Titlebar drag
    setupDrag(el, el.querySelector('.window-titlebar'), state);

    // Resize handles
    setupResize(el, state);

    // Window controls
    el.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'close') closeWindow(id);
      if (action === 'minimize') minimizeWindow(id);
      if (action === 'maximize') toggleMaximize(id);
    });

    // Focus on click
    el.addEventListener('mousedown', () => focusWindow(id));

    // Double-click titlebar to maximize
    el.querySelector('.window-titlebar').addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-controls')) return;
      toggleMaximize(id);
    });

    // Taskbar button
    addTaskbarBtn(id, app);

    OS.emit('window:open', { id, appId });
    return id;
  }

  function resizeHandles() {
    return ['n','s','e','w','ne','nw','se','sw']
      .map(d => `<div class="resize-handle resize-${d}" data-dir="${d}"></div>`)
      .join('');
  }

  // ===== Focus =====
  function focusWindow(id) {
    if (activeWindowId === id) return;
    activeWindowId = id;
    windows.forEach((s, wid) => {
      const el = document.getElementById(wid);
      if (el) el.classList.toggle('focused', wid === id);
    });
    const state = windows.get(id);
    if (state) {
      state.zIndex = ++zCounter;
      const el = document.getElementById(id);
      if (el) el.style.zIndex = state.zIndex;
    }
    updateTaskbarStates(id);
  }

  // ===== Close =====
  function closeWindow(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'windowIn 150ms cubic-bezier(0.4,0,0.2,1) reverse';
    setTimeout(() => {
      el.remove();
      windows.delete(id);
      removeTaskbarBtn(id);
      OS.emit('window:close', { id });
    }, 140);
  }

  // ===== Minimize =====
  function minimizeWindow(id) {
    const state = windows.get(id);
    if (!state) return;
    const el = document.getElementById(id);
    if (!el) return;
    state.minimized = true;
    el.style.display = 'none';
    updateTaskbarBtn(id, false);
    OS.emit('window:minimize', { id });
  }

  function restoreWindow(id) {
    const state = windows.get(id);
    if (!state) return;
    const el = document.getElementById(id);
    if (!el) return;
    state.minimized = false;
    el.style.display = '';
    focusWindow(id);
    updateTaskbarBtn(id, true);
    OS.emit('window:restore', { id });
  }

  // ===== Maximize =====
  function toggleMaximize(id) {
    const state = windows.get(id);
    if (!state) return;
    const el = document.getElementById(id);
    if (!el) return;

    if (state.maximized) {
      // Restore
      state.maximized = false;
      el.classList.remove('maximized');
      const b = state._prevBounds;
      el.style.left = b.x + 'px';
      el.style.top = b.y + 'px';
      el.style.width = b.w + 'px';
      el.style.height = b.h + 'px';
    } else {
      state._prevBounds = { x: state.x, y: state.y, w: state.w, h: state.h };
      state.maximized = true;
      el.classList.add('maximized');
      el.style.left = '0';
      el.style.top = '0';
      el.style.width = '100vw';
      el.style.height = `calc(100vh - 48px)`;
    }
  }

  // ===== Drag =====
  function setupDrag(el, handle, state) {
    let dragging = false;
    let startX, startY, origX, origY;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      if (state.maximized) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origX = state.x; origY = state.y;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      state.x = origX + dx;
      state.y = origY + dy;
      // Clamp
      state.x = Math.max(-state.w + 80, Math.min(window.innerWidth - 80, state.x));
      state.y = Math.max(0, Math.min(window.innerHeight - 48 - 34, state.y));
      el.style.left = state.x + 'px';
      el.style.top = state.y + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        document.body.style.userSelect = '';
      }
    });
  }

  // ===== Resize =====
  function setupResize(el, state) {
    el.querySelectorAll('.resize-handle').forEach(handle => {
      const dir = handle.dataset.dir;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.maximized) return;

        const startX = e.clientX, startY = e.clientY;
        const orig = { x: state.x, y: state.y, w: state.w, h: state.h };

        const app = OS.getApp(state.appId);
        const minW = app?.minWidth || 200;
        const minH = app?.minHeight || 120;

        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          let { x, y, w, h } = orig;

          if (dir.includes('e')) w = Math.max(minW, orig.w + dx);
          if (dir.includes('s')) h = Math.max(minH, orig.h + dy);
          if (dir.includes('w')) { w = Math.max(minW, orig.w - dx); x = orig.x + orig.w - w; }
          if (dir.includes('n')) { h = Math.max(minH, orig.h - dy); y = orig.y + orig.h - h; }

          state.x = x; state.y = y; state.w = w; state.h = h;
          el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${state.zIndex}`;
        };

        const onUp = () => {
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ===== Taskbar =====
  function addTaskbarBtn(winId, app) {
    const center = document.getElementById('taskbar-center');
    // Check if app already has a pinned button
    const existing = center.querySelector(`[data-appid="${app.id}"]`);
    if (existing) {
      existing.dataset.winid = winId;
      existing.classList.add('active');
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'taskbar-app-btn active';
    btn.dataset.winid = winId;
    btn.dataset.appid = app.id;
    btn.title = app.name;
    btn.innerHTML = `
      <span class="app-icon">${app.icon}</span>
      <div class="taskbar-app-indicator"></div>
    `;
    btn.addEventListener('click', () => {
      const state = windows.get(winId);
      if (!state) return;
      if (state.minimized) {
        restoreWindow(winId);
      } else if (activeWindowId === winId) {
        minimizeWindow(winId);
      } else {
        focusWindow(winId);
      }
    });

    // Right-click context
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showTaskbarCtx(e, winId, app);
    });

    center.appendChild(btn);
  }

  function removeTaskbarBtn(winId) {
    const btn = document.querySelector(`[data-winid="${winId}"]`);
    if (btn && !btn.dataset.pinned) btn.remove();
    else if (btn) {
      btn.classList.remove('active');
      delete btn.dataset.winid;
    }
  }

  function updateTaskbarBtn(winId, active) {
    const btn = document.querySelector(`.taskbar-app-btn[data-winid="${winId}"]`);
    if (btn) btn.classList.toggle('active', active);
  }

  function updateTaskbarStates(activeId) {
    document.querySelectorAll('.taskbar-app-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.winid === activeId || (!btn.dataset.winid && false));
    });
  }

  function showTaskbarCtx(e, winId, app) {
    const items = [
      { label: app.name, icon: app.icon, action: () => {} },
      { separator: true },
      { label: 'Restore', icon: '⬆️', action: () => restoreWindow(winId) },
      { label: 'Minimize', icon: '➖', action: () => minimizeWindow(winId) },
      { label: 'Maximize', icon: '⬜', action: () => toggleMaximize(winId) },
      { separator: true },
      { label: 'Close window', icon: '✖️', action: () => closeWindow(winId), danger: true },
    ];
    showContextMenu(e.clientX, e.clientY, items);
  }

  // ===== Context Menu =====
  function showContextMenu(x, y, items) {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = items.map((item, i) => {
      if (item.separator) return '<div class="ctx-separator"></div>';
      return `<div class="ctx-item ${item.danger ? 'danger' : ''}" data-idx="${i}">
        <span class="ctx-icon">${item.icon || ''}</span>
        <span>${item.label}</span>
      </div>`;
    }).join('');

    // Position
    menu.style.display = 'block';
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    menu.style.left = Math.min(x, window.innerWidth - mw - 4) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - mh - 4) + 'px';

    menu.querySelectorAll('.ctx-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        if (items[idx]?.action) items[idx].action();
        hideContextMenu();
      });
    });
  }

  function hideContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
  }

  // ===== Launch (public) =====
  function launch(appId, opts = {}) {
    // Check if already open (single instance apps)
    const singleInstance = ['settings'];
    if (singleInstance.includes(appId)) {
      for (const [id, state] of windows) {
        if (state.appId === appId) {
          if (state.minimized) restoreWindow(id);
          else focusWindow(id);
          return id;
        }
      }
    }
    return createWindow(appId, opts);
  }

  function getWindows() { return windows; }
  function getActiveId() { return activeWindowId; }

  // Hide context menu on outside click
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#context-menu')) hideContextMenu();
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn') &&
        !e.target.closest('#all-apps-menu')) {
      document.getElementById('start-menu').style.display = 'none';
      document.getElementById('all-apps-menu').style.display = 'none';
    }
    if (!e.target.closest('#action-center') && !e.target.closest('#action-center-btn')) {
      document.getElementById('action-center').style.display = 'none';
    }
    if (!e.target.closest('#search-overlay') && !e.target.closest('#search-btn')) {
      document.getElementById('search-overlay').style.display = 'none';
    }
  });

  return {
    launch, closeWindow, minimizeWindow, restoreWindow, toggleMaximize,
    focusWindow, getWindows, getActiveId,
    showContextMenu, hideContextMenu,
  };
})();

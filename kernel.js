/**
 * BrowserOS Kernel
 * Core OS logic, app registry, event bus
 */

window.OS = (function() {
  'use strict';

  // ===== App Registry =====
  const APP_REGISTRY = {};

  // ===== Event Bus =====
  const listeners = {};

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => { listeners[event] = listeners[event].filter(f => f !== fn); };
  }

  // ===== Notification System =====
  const notifications = [];

  function notify(title, body, icon = '🔔') {
    const n = { id: Date.now(), title, body, icon, time: new Date() };
    notifications.unshift(n);
    emit('notification', n);
    renderNotifBell();
    return n.id;
  }

  function renderNotifBell() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (notifications.length === 0) {
      list.innerHTML = '<div class="notif-empty">No new notifications</div>';
      return;
    }
    list.innerHTML = notifications.slice(0, 5).map(n => `
      <div class="notif-item">
        <div class="notif-title">${n.icon} ${n.title}</div>
        <div class="notif-body">${n.body}</div>
      </div>
    `).join('');
  }

  // ===== App Registration =====
  function registerApp(id, config) {
    APP_REGISTRY[id] = {
      id,
      name: config.name,
      icon: config.icon,
      category: config.category || 'Apps',
      pinned: config.pinned !== false,
      pinnedTaskbar: config.pinnedTaskbar || false,
      desktopIcon: config.desktopIcon !== false,
      launch: config.launch,
      minWidth: config.minWidth || 400,
      minHeight: config.minHeight || 300,
      defaultWidth: config.defaultWidth || 800,
      defaultHeight: config.defaultHeight || 560,
      keywords: config.keywords || [],
      fileTypes: config.fileTypes || [],
    };
  }

  function getApp(id) { return APP_REGISTRY[id]; }

  function getAllApps() {
    return Object.values(APP_REGISTRY).sort((a, b) => a.name.localeCompare(b.name));
  }

  function search(query) {
    if (!query) return [];
    query = query.toLowerCase();
    return getAllApps().filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.keywords.some(k => k.toLowerCase().includes(query))
    );
  }

  // ===== Settings Storage =====
  const settingsDefaults = {
    wallpaper: 'default',
    theme: 'dark',
    accentColor: '#0078d4',
    taskbarCenter: true,
    volume: 75,
    brightness: 85,
    fontSize: 14,
    animations: true,
    notifications: true,
    username: 'User',
  };

  function getSetting(key) {
    try {
      const v = localStorage.getItem('os_setting_' + key);
      return v !== null ? JSON.parse(v) : settingsDefaults[key];
    } catch { return settingsDefaults[key]; }
  }

  function setSetting(key, value) {
    localStorage.setItem('os_setting_' + key, JSON.stringify(value));
    emit('setting:' + key, value);
  }

  // ===== Clipboard =====
  let clipboard = null;
  function setClipboard(data) { clipboard = data; }
  function getClipboard() { return clipboard; }

  // ===== File Association =====
  function openFile(fileEntry) {
    const ext = (fileEntry.name.split('.').pop() || '').toLowerCase();
    const app = getAllApps().find(a => a.fileTypes.includes(ext));
    if (app) {
      window.WM.launch(app.id, { file: fileEntry });
    } else {
      window.WM.launch('notepad', { file: fileEntry });
    }
  }

  return {
    APP_REGISTRY,
    emit, on,
    notify, notifications, renderNotifBell,
    registerApp, getApp, getAllApps, search,
    getSetting, setSetting,
    setClipboard, getClipboard,
    openFile,
    version: '1.0.0',
  };
})();

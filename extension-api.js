/**
 * BrowserOS Extension API
 * Allows third-party extensions to integrate with the OS
 */

window.BrowserOSExtensions = (function() {
  'use strict';

  const extensions = new Map();

  /**
   * Register an extension
   * @param {string} id - Unique extension ID
   * @param {object} config - Extension configuration
   */
  function register(id, config) {
    if (extensions.has(id)) {
      console.warn(`Extension "${id}" already registered`);
      return;
    }

    const ext = {
      id,
      name: config.name || id,
      version: config.version || '1.0.0',
      description: config.description || '',
      author: config.author || 'Unknown',
      icon: config.icon || '🧩',
      active: false,
    };

    extensions.set(id, ext);

    // Register as an app if it provides a UI
    if (config.app) {
      OS.registerApp(id, {
        name: config.name,
        icon: config.icon || '🧩',
        category: config.category || 'Extensions',
        pinned: config.pinned || false,
        defaultWidth: config.defaultWidth || 600,
        defaultHeight: config.defaultHeight || 400,
        keywords: config.keywords || [],
        launch: config.app.launch,
      });
    }

    // Add system tray icon
    if (config.tray) {
      addTrayIcon(id, config.tray);
    }

    // Add context menu items to desktop
    if (config.contextMenu) {
      addContextMenuItems(id, config.contextMenu);
    }

    // Run activation
    if (config.onActivate) {
      try {
        config.onActivate(createExtensionContext(id));
        ext.active = true;
      } catch(e) {
        console.error(`Extension "${id}" failed to activate:`, e);
      }
    }

    console.log(`[Extensions] Registered: ${ext.name} v${ext.version}`);
    OS.notify('Extensions', `${ext.name} v${ext.version} activated`);
  }

  function createExtensionContext(extId) {
    return {
      // OS access
      os: OS,
      fs: FS,
      wm: WM,

      // Notification helper
      notify(title, body) {
        OS.notify(`[${extId}] ${title}`, body);
      },

      // Settings access
      getSetting: (key) => OS.getSetting(`ext_${extId}_${key}`),
      setSetting: (key, value) => OS.setSetting(`ext_${extId}_${key}`, value),

      // File system helpers
      async readDir(path) { return FS.readDir(path); },
      async readFile(path) { return FS.readFile(path); },
      async writeFile(path, blob) { return FS.writeFile(path, blob); },

      // Listen to events
      on: OS.on.bind(OS),
      emit: OS.emit.bind(OS),

      // Launch apps
      launch(appId, opts) { return WM.launch(appId, opts); },
    };
  }

  function addTrayIcon(extId, config) {
    const tray = document.getElementById('tray-icons');
    if (!tray) return;
    const btn = document.createElement('button');
    btn.title = config.tooltip || extId;
    btn.innerHTML = config.icon || '🧩';
    btn.style.cssText = 'width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:14px;background:none;border:none;cursor:pointer;color:var(--text-secondary)';
    btn.addEventListener('click', config.onClick || (() => {}));
    tray.appendChild(btn);
  }

  function addContextMenuItems(extId, items) {
    OS.on('desktop:context', (e) => {
      return [...items, { separator: true }];
    });
  }

  function unregister(id) {
    const ext = extensions.get(id);
    if (!ext) return;
    extensions.delete(id);
    console.log(`[Extensions] Unregistered: ${ext.name}`);
  }

  function list() {
    return [...extensions.values()];
  }

  function get(id) {
    return extensions.get(id);
  }

  // ===== Built-in Extensions =====

  // Clock Widget Extension
  register('clock-widget', {
    name: 'Clock Widget',
    version: '1.0',
    description: 'Desktop clock widget',
    icon: '🕐',
    category: 'Widgets',
    pinned: false,
    app: {
      launch(container, winState) {
        container.style.background = 'transparent';
        container.innerHTML = `
          <div id="clock-widget-display" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(20px)">
            <div id="cw-time" style="font-size:48px;font-weight:200;color:white"></div>
            <div id="cw-date" style="font-size:14px;color:rgba(255,255,255,0.7)"></div>
            <div id="cw-seconds" style="display:flex;gap:4px;margin-top:16px">
              ${Array.from({length:60},(_,i)=>`<div style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.2)" id="cwsec${i}"></div>`).join('')}
            </div>
          </div>
        `;
        function update() {
          const n = new Date();
          document.getElementById('cw-time').textContent = n.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
          document.getElementById('cw-date').textContent = n.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
          for (let i=0;i<60;i++) {
            const d = document.getElementById(`cwsec${i}`);
            if(d) d.style.background = i<=n.getSeconds() ? 'var(--accent)' : 'rgba(255,255,255,0.15)';
          }
        }
        update();
        const t = setInterval(update, 1000);
        winState._cleanup = () => clearInterval(t);
      },
    },
    defaultWidth: 320,
    defaultHeight: 200,
  });

  // System Monitor Extension
  register('system-monitor', {
    name: 'System Monitor',
    version: '1.0',
    description: 'Monitor system resources',
    icon: '📊',
    category: 'System',
    pinned: true,
    app: {
      launch(container, winState) {
        const history = { cpu: Array(60).fill(0), mem: Array(60).fill(0) };
        let tick = 0;

        container.innerHTML = `
          <div style="padding:16px;height:100%;overflow-y:auto">
            <div style="margin-bottom:16px">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">CPU USAGE (simulated)</div>
              <canvas id="cpu-chart-${winState.id}" width="300" height="80" style="width:100%;border-radius:6px;background:rgba(0,0,0,0.3)"></canvas>
              <div style="font-size:24px;font-weight:200;margin-top:4px" id="cpu-val-${winState.id}">0%</div>
            </div>
            <div style="margin-bottom:16px">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">MEMORY USAGE (simulated)</div>
              <canvas id="mem-chart-${winState.id}" width="300" height="80" style="width:100%;border-radius:6px;background:rgba(0,0,0,0.3)"></canvas>
              <div style="font-size:24px;font-weight:200;margin-top:4px" id="mem-val-${winState.id}">0 MB</div>
            </div>
            <div class="settings-card" style="margin-top:8px">
              <div class="settings-row">
                <div class="settings-label">Browser</div>
                <div style="font-size:11px;color:var(--text-secondary)">${navigator.userAgent.split(' ').pop()}</div>
              </div>
              <div class="settings-row">
                <div class="settings-label">CPU Cores</div>
                <div style="font-size:11px;color:var(--text-secondary)">${navigator.hardwareConcurrency || '?'}</div>
              </div>
              <div class="settings-row">
                <div class="settings-label">Device Memory</div>
                <div style="font-size:11px;color:var(--text-secondary)">${navigator.deviceMemory || '?'} GB</div>
              </div>
              <div class="settings-row">
                <div class="settings-label">Open Windows</div>
                <div style="font-size:11px;color:var(--text-secondary)" id="sysmon-wins-${winState.id}">0</div>
              </div>
            </div>
          </div>
        `;

        function drawChart(canvasId, data, color) {
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          const w = canvas.width, h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          data.forEach((v, i) => {
            const x = (i / data.length) * w;
            const y = h - (v / 100) * h;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.fillStyle = color + '33';
          ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
        }

        const interval = setInterval(() => {
          tick++;
          const cpu = Math.min(100, Math.max(0, (history.cpu[59] || 0) + (Math.random() - 0.48) * 15));
          const mem = Math.min(100, Math.max(0, (history.mem[59] || 30) + (Math.random() - 0.5) * 5));
          history.cpu.push(cpu); history.cpu.shift();
          history.mem.push(mem); history.mem.shift();

          drawChart(`cpu-chart-${winState.id}`, history.cpu, '#0078d4');
          drawChart(`mem-chart-${winState.id}`, history.mem, '#10b981');

          const cv = document.getElementById(`cpu-val-${winState.id}`);
          const mv = document.getElementById(`mem-val-${winState.id}`);
          const wv = document.getElementById(`sysmon-wins-${winState.id}`);
          if (cv) cv.textContent = cpu.toFixed(1) + '%';
          if (mv) mv.textContent = (mem * 0.16).toFixed(0) + ' MB / ' + ((navigator.deviceMemory || 4) * 1024) + ' MB';
          if (wv) wv.textContent = WM.getWindows().size;
        }, 500);

        winState._cleanup = () => clearInterval(interval);
      },
    },
    defaultWidth: 420,
    defaultHeight: 520,
  });

  return { register, unregister, list, get };
})();

// Also expose on OS
OS.extensions = BrowserOSExtensions;

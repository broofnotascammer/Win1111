/**
 * BrowserOS - Settings
 */

OS.registerApp('settings', {
  name: 'Settings',
  icon: '⚙️',
  category: 'System',
  pinned: true,
  pinnedTaskbar: true,
  defaultWidth: 820,
  defaultHeight: 600,
  minWidth: 500,
  minHeight: 400,
  keywords: ['settings', 'config', 'preferences', 'system', 'personalize', 'display'],
  launch(container, winState, opts) {
    const navItems = [
      { id: 'system', icon: '🖥️', label: 'System' },
      { id: 'personalization', icon: '🎨', label: 'Personalization' },
      { id: 'apps', icon: '📦', label: 'Apps' },
      { id: 'accounts', icon: '👤', label: 'Accounts' },
      { id: 'privacy', icon: '🔒', label: 'Privacy & Security' },
      { id: 'storage', icon: '💾', label: 'Storage' },
      { id: 'about', icon: 'ℹ️', label: 'About' },
    ];

    container.innerHTML = `
      <div class="settings-layout">
        <div class="settings-nav">
          <div style="padding:12px 16px;font-size:16px;font-weight:600;border-bottom:1px solid var(--border);margin-bottom:6px">Settings</div>
          ${navItems.map(n => `
            <div class="settings-nav-item" data-page="${n.id}">
              <span class="settings-nav-icon">${n.icon}</span>
              <span>${n.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="settings-content" id="settings-content-${winState.id}"></div>
      </div>
    `;

    const id = winState.id;
    const content = document.getElementById(`settings-content-${id}`);

    const pages = {
      system: `
        <h2>System</h2>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Display</div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Brightness</div>
              <div class="settings-desc">Adjust screen brightness</div>
            </div>
            <input type="range" min="0" max="100" value="${OS.getSetting('brightness') || 85}" id="set-brightness-${id}" style="width:120px">
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Font size</div>
              <div class="settings-desc">Adjust text size</div>
            </div>
            <select id="set-fontsize-${id}" style="background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:12px">
              <option value="12">Small (12px)</option>
              <option value="14" selected>Medium (14px)</option>
              <option value="16">Large (16px)</option>
              <option value="18">Extra Large (18px)</option>
            </select>
          </div>
        </div>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Sound</div>
          <div class="settings-row">
            <div class="settings-label">Volume</div>
            <input type="range" min="0" max="100" value="${OS.getSetting('volume') || 75}" id="set-volume-${id}" style="width:120px">
          </div>
        </div>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Notifications</div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Notifications</div>
              <div class="settings-desc">Show app notifications</div>
            </div>
            <div class="toggle ${OS.getSetting('notifications') !== false ? 'on' : ''}" id="set-notifs-${id}"></div>
          </div>
        </div>
      `,

      personalization: `
        <h2>Personalization</h2>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Wallpaper</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" id="wallpaper-grid-${id}">
            ${Desktop.getWallpapers().map(wp => `
              <div class="wallpaper-option ${OS.getSetting('wallpaper') === wp.id ? 'active' : ''}" 
                   data-id="${wp.id}"
                   style="height:70px;border-radius:8px;cursor:pointer;background:${wp.style};border:2px solid ${OS.getSetting('wallpaper') === wp.id ? 'var(--accent)' : 'transparent'};position:relative;overflow:hidden;transition:border-color 150ms">
                <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:11px;background:rgba(0,0,0,0.4);padding:2px;color:white">${wp.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Accent Color</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="accent-colors-${id}">
            ${['#0078d4','#ff4444','#ff8c00','#6b21a8','#0ea5e9','#10b981','#f59e0b','#ec4899'].map(c => `
              <div style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${OS.getSetting('accentColor')===c?'white':'transparent'};transition:transform 100ms" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Effects</div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Transparency effects</div>
              <div class="settings-desc">Glassmorphism and blur</div>
            </div>
            <div class="toggle on" id="set-transparency-${id}"></div>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Animation effects</div>
              <div class="settings-desc">Window animations</div>
            </div>
            <div class="toggle ${OS.getSetting('animations') !== false ? 'on' : ''}" id="set-animations-${id}"></div>
          </div>
        </div>
      `,

      apps: `
        <h2>Apps</h2>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Installed Apps</div>
          ${OS.getAllApps().map(app => `
            <div class="settings-row">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">${app.icon}</span>
                <div>
                  <div class="settings-label">${app.name}</div>
                  <div class="settings-desc">${app.category}</div>
                </div>
              </div>
              <button style="background:rgba(255,255,255,0.07);border-radius:6px;padding:4px 12px;font-size:12px;color:var(--text-secondary)" onclick="WM.launch('${app.id}')">Open</button>
            </div>
          `).join('')}
        </div>
      `,

      accounts: `
        <h2>Accounts</h2>
        <div class="settings-card">
          <div style="display:flex;align-items:center;gap:16px;padding:12px 0;margin-bottom:12px;border-bottom:1px solid var(--border)">
            <div style="font-size:48px;width:72px;height:72px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center">👤</div>
            <div>
              <div style="font-size:18px;font-weight:600" id="set-displayname-${id}">${OS.getSetting('username') || 'User'}</div>
              <div style="font-size:12px;color:var(--text-secondary)">Local Account</div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label">Username</div>
            <input type="text" value="${OS.getSetting('username') || 'User'}" id="set-username-${id}" style="width:150px;font-size:12px">
          </div>
        </div>
      `,

      privacy: `
        <h2>Privacy & Security</h2>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Storage</div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Clear all data</div>
              <div class="settings-desc">Delete all files, settings, and app data</div>
            </div>
            <button id="set-cleardata-${id}" style="background:rgba(196,43,28,0.2);color:#ff6b6b;border-radius:6px;padding:6px 14px;font-size:12px">Clear Data</button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Export all files</div>
              <div class="settings-desc">Download all your files as a package</div>
            </div>
            <button id="set-export-${id}" style="background:rgba(0,120,212,0.2);color:var(--accent-light);border-radius:6px;padding:6px 14px;font-size:12px">Export</button>
          </div>
        </div>
      `,

      storage: `
        <h2>Storage</h2>
        <div class="settings-card">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">Storage Overview</div>
          <div id="storage-info-${id}" style="font-size:13px;color:var(--text-secondary)">Calculating...</div>
        </div>
      `,

      about: `
        <h2>About</h2>
        <div class="settings-card">
          <div style="display:flex;align-items:center;gap:16px;padding:8px 0">
            <svg width="48" height="48" viewBox="0 0 88 88"><path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.022 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z" fill="#00ADEF"/></svg>
            <div>
              <div style="font-size:20px;font-weight:600">BrowserOS</div>
              <div style="font-size:12px;color:var(--text-secondary)">Version ${OS.version} · Windows 11 Simulation</div>
            </div>
          </div>
          <div class="settings-row"><div class="settings-label">OS Version</div><div class="settings-desc">${OS.version}</div></div>
          <div class="settings-row"><div class="settings-label">Build</div><div class="settings-desc">Web · ${new Date().getFullYear()}</div></div>
          <div class="settings-row"><div class="settings-label">Browser</div><div class="settings-desc">${navigator.userAgent.split(' ').slice(-2).join(' ')}</div></div>
          <div class="settings-row"><div class="settings-label">Cores</div><div class="settings-desc">${navigator.hardwareConcurrency || '?'}</div></div>
          <div class="settings-row"><div class="settings-label">Memory</div><div class="settings-desc">${navigator.deviceMemory || '?'} GB</div></div>
          <div class="settings-row"><div class="settings-label">Platform</div><div class="settings-desc">${navigator.platform}</div></div>
        </div>
      `,
    };

    let activePage = opts?.page || 'system';

    function showPage(pageId) {
      activePage = pageId;
      content.innerHTML = pages[pageId] || `<h2>${pageId}</h2><p style="color:var(--text-secondary)">Coming soon</p>`;

      container.querySelectorAll('.settings-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
      });

      // Bind page controls
      bindPageControls(pageId);
    }

    function bindPageControls(pageId) {
      if (pageId === 'system') {
        const bEl = document.getElementById(`set-brightness-${id}`);
        if (bEl) bEl.addEventListener('input', (e) => {
          OS.setSetting('brightness', e.target.value);
          document.getElementById('wallpaper').style.filter = `brightness(${e.target.value / 100})`;
        });

        const vEl = document.getElementById(`set-volume-${id}`);
        if (vEl) vEl.addEventListener('input', (e) => OS.setSetting('volume', e.target.value));

        const nEl = document.getElementById(`set-notifs-${id}`);
        if (nEl) nEl.addEventListener('click', () => {
          nEl.classList.toggle('on');
          OS.setSetting('notifications', nEl.classList.contains('on'));
        });
      }

      if (pageId === 'personalization') {
        document.getElementById(`wallpaper-grid-${id}`)?.addEventListener('click', (e) => {
          const opt = e.target.closest('.wallpaper-option');
          if (!opt) return;
          document.querySelectorAll('.wallpaper-option').forEach(o => { o.style.borderColor = 'transparent'; });
          opt.style.borderColor = 'var(--accent)';
          OS.setSetting('wallpaper', opt.dataset.id);
          Desktop.renderWallpaper();
        });

        document.getElementById(`accent-colors-${id}`)?.addEventListener('click', (e) => {
          const swatch = e.target;
          if (!swatch.dataset.color) return;
          document.getElementById('style-root') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'style-root' }));
          document.getElementById('style-root').textContent = `:root { --accent: ${swatch.dataset.color}; --accent-light: ${swatch.dataset.color}; }`;
          OS.setSetting('accentColor', swatch.dataset.color);
        });
      }

      if (pageId === 'accounts') {
        const uEl = document.getElementById(`set-username-${id}`);
        if (uEl) uEl.addEventListener('change', (e) => {
          OS.setSetting('username', e.target.value);
          document.getElementById(`set-displayname-${id}`).textContent = e.target.value;
          OS.notify('Settings', 'Username updated');
        });
      }

      if (pageId === 'privacy') {
        document.getElementById(`set-cleardata-${id}`)?.addEventListener('click', async () => {
          if (confirm('Delete ALL data? This cannot be undone.')) {
            const dbs = ['BrowserOS_FS'];
            for (const dbName of dbs) {
              indexedDB.deleteDatabase(dbName);
            }
            localStorage.clear();
            location.reload();
          }
        });
      }

      if (pageId === 'storage') {
        const el = document.getElementById(`storage-info-${id}`);
        if (el) {
          FS.getAllFiles('/').then(files => {
            const total = files.reduce((a, f) => a + (f.size || 0), 0);
            el.innerHTML = `
              <div style="margin-bottom:8px">Total files: ${files.filter(f=>f.type==='file').length}</div>
              <div style="margin-bottom:8px">Total folders: ${files.filter(f=>f.type==='directory').length}</div>
              <div>Total size: ${FS.formatSize(total)}</div>
            `;
          });
        }
      }
    }

    container.querySelectorAll('.settings-nav-item').forEach(el => {
      el.addEventListener('click', () => showPage(el.dataset.page));
    });

    showPage(activePage);
  },
});

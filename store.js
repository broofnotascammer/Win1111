/**
 * BrowserOS - App Store
 */

OS.registerApp('store', {
  name: 'Microsoft Store',
  icon: '🛍️',
  category: 'System',
  pinned: true,
  pinnedTaskbar: true,
  defaultWidth: 900,
  defaultHeight: 620,
  minWidth: 500,
  minHeight: 400,
  keywords: ['store', 'install', 'apps', 'download', 'marketplace'],
  launch(container, winState) {
    const storeApps = [
      { name: 'Spotify', icon: '🎵', cat: 'Music', desc: 'Music streaming', action: 'browser', url: 'https://open.spotify.com' },
      { name: 'WhatsApp', icon: '💬', cat: 'Social', desc: 'Messaging app', action: 'browser', url: 'https://web.whatsapp.com' },
      { name: 'Discord', icon: '🎮', cat: 'Social', desc: 'Chat for gamers', action: 'browser', url: 'https://discord.com/app' },
      { name: 'Notion', icon: '📋', cat: 'Productivity', desc: 'All-in-one workspace', action: 'browser', url: 'https://notion.so' },
      { name: 'Figma', icon: '🎨', cat: 'Design', desc: 'UI design tool', action: 'browser', url: 'https://figma.com' },
      { name: 'GitHub', icon: '🐙', cat: 'Development', desc: 'Code hosting', action: 'browser', url: 'https://github.com' },
      { name: 'Google Docs', icon: '📝', cat: 'Productivity', desc: 'Document editor', action: 'browser', url: 'https://docs.google.com' },
      { name: 'Google Drive', icon: '☁️', cat: 'Storage', desc: 'Cloud storage', action: 'browser', url: 'https://drive.google.com' },
      { name: 'Trello', icon: '📌', cat: 'Productivity', desc: 'Project boards', action: 'browser', url: 'https://trello.com' },
      { name: 'Reddit', icon: '🦊', cat: 'Social', desc: 'Front page of the internet', action: 'browser', url: 'https://reddit.com' },
      { name: 'Twitter/X', icon: '𝕏', cat: 'Social', desc: 'Social network', action: 'browser', url: 'https://twitter.com' },
      { name: 'YouTube', icon: '▶️', cat: 'Entertainment', desc: 'Video streaming', action: 'browser', url: 'https://youtube.com' },
      { name: 'Twitch', icon: '💜', cat: 'Entertainment', desc: 'Live streaming', action: 'browser', url: 'https://twitch.tv' },
      { name: 'Canva', icon: '✏️', cat: 'Design', desc: 'Online design tool', action: 'browser', url: 'https://canva.com' },
      { name: 'CodePen', icon: '🔵', cat: 'Development', desc: 'Online code editor', action: 'browser', url: 'https://codepen.io' },
      { name: 'VS Code Online', icon: '💻', cat: 'Development', desc: 'Web-based VS Code', action: 'browser', url: 'https://vscode.dev' },
      { name: 'Excalidraw', icon: '✏️', cat: 'Tools', desc: 'Virtual whiteboard', action: 'browser', url: 'https://excalidraw.com' },
      { name: 'Overleaf', icon: '🌿', cat: 'Academic', desc: 'LaTeX editor', action: 'browser', url: 'https://overleaf.com' },
    ];

    const categories = ['All', ...new Set(storeApps.map(a => a.cat))];
    let activeCategory = 'All';
    let searchQuery = '';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <div style="padding:12px 16px;background:var(--bg-elevated);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🛍️</span>
          <span style="font-size:15px;font-weight:600">Microsoft Store</span>
          <div style="flex:1"></div>
          <input type="text" id="store-search-${winState.id}" placeholder="🔍 Search apps..." style="width:200px;border-radius:16px;font-size:12px">
        </div>
        <div style="display:flex;gap:6px;padding:8px 12px;background:var(--bg-primary);border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0" id="store-cats-${winState.id}">
          ${categories.map(c => `<button class="store-cat-btn ${c==='All'?'active':''}" data-cat="${c}" style="padding:4px 14px;border-radius:14px;font-size:12px;white-space:nowrap;background:${c==='All'?'var(--accent)':'rgba(255,255,255,0.07)'};color:${c==='All'?'white':'var(--text-secondary)'}">${c}</button>`).join('')}
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px">
          <div class="store-banner">
            <h2>🌐 Web Apps Collection</h2>
            <p>Launch your favorite web apps directly in BrowserOS</p>
          </div>
          <div class="store-grid" id="store-grid-${winState.id}"></div>
        </div>
      </div>
    `;

    const id = winState.id;
    const grid = document.getElementById(`store-grid-${id}`);
    const installed = new Set(JSON.parse(localStorage.getItem('store_installed') || '[]'));

    function render() {
      let apps = storeApps;
      if (activeCategory !== 'All') apps = apps.filter(a => a.cat === activeCategory);
      if (searchQuery) apps = apps.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.desc.toLowerCase().includes(searchQuery.toLowerCase()));

      grid.innerHTML = apps.map(app => `
        <div class="store-item" data-name="${app.name}">
          <div class="store-item-icon">${app.icon}</div>
          <div class="store-item-name">${app.name}</div>
          <div class="store-item-cat">${app.cat}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">${app.desc}</div>
          <button class="store-item-btn" data-name="${app.name}">
            ${installed.has(app.name) ? '✅ Open' : '⬇️ Get'}
          </button>
        </div>
      `).join('') || '<div style="grid-column:1/-1;color:var(--text-disabled);text-align:center;padding:40px">No apps found</div>';

      grid.querySelectorAll('.store-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.dataset.name;
          const app = storeApps.find(a => a.name === name);
          if (!app) return;

          installed.add(name);
          localStorage.setItem('store_installed', JSON.stringify([...installed]));
          btn.textContent = '✅ Open';

          if (app.action === 'browser') {
            WM.launch('browser', { url: app.url, title: app.name });
          }
          OS.notify('Store', `${app.name} is ready to use!`);
        });
      });
    }

    document.getElementById(`store-search-${id}`).addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    document.getElementById(`store-cats-${id}`).addEventListener('click', (e) => {
      const btn = e.target.closest('.store-cat-btn');
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      document.querySelectorAll(`#store-cats-${id} .store-cat-btn`).forEach(b => {
        b.style.background = b.dataset.cat === activeCategory ? 'var(--accent)' : 'rgba(255,255,255,0.07)';
        b.style.color = b.dataset.cat === activeCategory ? 'white' : 'var(--text-secondary)';
      });
      render();
    });

    render();
  },
});

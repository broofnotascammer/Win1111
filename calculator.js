/**
 * BrowserOS - Calculator
 */
OS.registerApp('calculator', {
  name: 'Calculator',
  icon: '🧮',
  category: 'Accessories',
  pinned: true,
  defaultWidth: 320,
  defaultHeight: 480,
  minWidth: 280,
  minHeight: 400,
  keywords: ['calc', 'math', 'number', 'compute'],
  launch(container, winState) {
    let expr = '';
    let result = '0';
    let justCalc = false;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div class="calc-display">
          <div class="calc-expression" id="calc-expr-${winState.id}"></div>
          <div class="calc-result" id="calc-res-${winState.id}">0</div>
        </div>
        <div class="calc-grid" id="calc-grid-${winState.id}" style="flex:1"></div>
      </div>
    `;

    const id = winState.id;
    const exprEl = document.getElementById(`calc-expr-${id}`);
    const resEl = document.getElementById(`calc-res-${id}`);
    const grid = document.getElementById(`calc-grid-${id}`);

    const buttons = [
      ['%', 'op'], ['CE', 'clear'], ['C', 'clear'], ['⌫', 'clear'],
      ['1/x', 'op'], ['x²', 'op'], ['√x', 'op'], ['÷', 'op'],
      ['7', ''], ['8', ''], ['9', ''], ['×', 'op'],
      ['4', ''], ['5', ''], ['6', ''], ['−', 'op'],
      ['1', ''], ['2', ''], ['3', ''], ['+', 'op'],
      ['+/−', 'op'], ['0', 'wide'], ['.', ''], ['=', 'eq'],
    ];

    grid.innerHTML = buttons.map(([label, cls]) =>
      `<div class="calc-btn ${cls}" data-val="${label}">${label}</div>`
    ).join('');

    function update() {
      exprEl.textContent = expr;
      resEl.textContent = result;
      // Scale font
      const len = result.length;
      resEl.style.fontSize = len > 14 ? '20px' : len > 10 ? '28px' : '40px';
    }

    function calculate() {
      try {
        let e = expr
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-');
        result = String(eval(e));
        if (result.includes('.') && result.split('.')[1].length > 10) {
          result = parseFloat(result).toPrecision(10).replace(/\.?0+$/, '');
        }
      } catch { result = 'Error'; }
    }

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;
      const val = btn.dataset.val;

      if (justCalc && !'÷×−+='.includes(val) && val !== '=') {
        expr = ''; result = '0'; justCalc = false;
      }

      if (val === '=') {
        if (expr) { calculate(); justCalc = true; }
      } else if (val === 'C') {
        expr = ''; result = '0';
      } else if (val === 'CE') {
        result = '0';
      } else if (val === '⌫') {
        if (expr) { expr = expr.slice(0, -1); }
        else result = result.slice(0, -1) || '0';
      } else if (val === '%') {
        if (result !== '0') { result = String(parseFloat(result) / 100); }
      } else if (val === '+/−') {
        if (result !== '0') result = result.startsWith('-') ? result.slice(1) : '-' + result;
      } else if (val === '1/x') {
        if (result !== '0') { result = String(1 / parseFloat(result)); }
      } else if (val === 'x²') {
        result = String(Math.pow(parseFloat(result), 2));
      } else if (val === '√x') {
        result = String(Math.sqrt(parseFloat(result)));
      } else {
        expr += val;
        justCalc = false;
      }

      update();
    });

    // Keyboard
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => {
      const map = {'Enter': '=', 'Escape': 'C', 'Backspace': '⌫', '*': '×', '/': '÷', '-': '−'};
      const key = map[e.key] || e.key;
      const btn = grid.querySelector(`[data-val="${key}"]`);
      if (btn) { btn.click(); btn.style.background = 'rgba(255,255,255,0.2)'; setTimeout(() => btn.style.background = '', 80); }
    });
  },
});

/**
 * BrowserOS - Paint
 */
OS.registerApp('paint', {
  name: 'Paint',
  icon: '🎨',
  category: 'Accessories',
  pinned: true,
  defaultWidth: 860,
  defaultHeight: 560,
  minWidth: 500,
  minHeight: 380,
  keywords: ['draw', 'art', 'image', 'canvas', 'brush', 'paint'],
  launch(container, winState) {
    let tool = 'brush';
    let color = '#ffffff';
    let bgColor = '#1a1a1a';
    let brushSize = 4;
    let drawing = false;
    let lastX = 0, lastY = 0;
    let snapshot = null;

    const COLORS = ['#ffffff','#000000','#ff0000','#ff7f00','#ffff00','#00ff00','#00ffff','#0000ff',
                    '#8b00ff','#ff00ff','#ff69b4','#a52a2a','#808080','#c0c0c0','#ffd700','#00fa9a'];

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div class="paint-toolbar">
          <div style="display:flex;gap:2px">
            ${[
              ['brush','🖌️','Brush'],['eraser','🩹','Eraser'],['line','📏','Line'],
              ['rect','⬜','Rectangle'],['circle','⬤','Ellipse'],['fill','🪣','Fill'],
              ['text','T','Text'],
            ].map(([t,i,l]) => `<div class="paint-tool-btn ${t==='brush'?'active':''}" data-tool="${t}" title="${l}">${i}</div>`).join('')}
          </div>
          <div style="width:1px;height:28px;background:var(--border);margin:0 6px"></div>
          <div style="display:flex;flex-direction:column;gap:2px">
            <input type="range" id="paint-size-${winState.id}" min="1" max="50" value="4" style="width:80px;height:4px;appearance:none;background:rgba(255,255,255,0.2);border:none;padding:0">
            <span id="paint-size-label-${winState.id}" style="font-size:11px;color:var(--text-secondary)">Size: 4px</span>
          </div>
          <div style="width:1px;height:28px;background:var(--border);margin:0 6px"></div>
          <div class="paint-colors" id="paint-colors-${winState.id}">
            ${COLORS.map((c,i) => `<div class="color-swatch ${i===0?'active':''}" data-color="${c}" style="background:${c}" title="${c}"></div>`).join('')}
          </div>
          <div style="width:1px;height:28px;background:var(--border);margin:0 6px"></div>
          <button onclick="document.getElementById('paint-canvas-${winState.id}').getContext('2d').clearRect(0,0,9999,9999);document.getElementById('paint-canvas-${winState.id}').getContext('2d').fillStyle='${bgColor}';document.getElementById('paint-canvas-${winState.id}').getContext('2d').fillRect(0,0,9999,9999)">🗑️ Clear</button>
          <button id="paint-save-${winState.id}">💾 Save</button>
          <button id="paint-download-${winState.id}">📥 Download</button>
        </div>
        <div class="paint-canvas-wrapper">
          <canvas id="paint-canvas-${winState.id}" width="1200" height="800"></canvas>
        </div>
      </div>
    `;

    const id = winState.id;
    const canvas = document.getElementById(`paint-canvas-${id}`);
    const ctx = canvas.getContext('2d');

    // Fill canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tool buttons
    container.querySelectorAll('.paint-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tool = btn.dataset.tool;
        canvas.style.cursor = tool === 'eraser' ? 'cell' : tool === 'fill' ? 'crosshair' : 'crosshair';
      });
    });

    // Colors
    document.getElementById(`paint-colors-${id}`).addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      color = swatch.dataset.color;
    });

    // Brush size
    const sizeSlider = document.getElementById(`paint-size-${id}`);
    const sizeLabel = document.getElementById(`paint-size-label-${id}`);
    sizeSlider.addEventListener('input', () => {
      brushSize = parseInt(sizeSlider.value);
      sizeLabel.textContent = `Size: ${brushSize}px`;
    });

    // Drawing
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    function floodFill(x, y, fillColor) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = img.data;
      const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4;
      const [tr, tg, tb, ta] = [data[idx], data[idx+1], data[idx+2], data[idx+3]];

      const fc = hexToRGB(fillColor);
      if (tr===fc.r && tg===fc.g && tb===fc.b) return;

      const stack = [[Math.round(x), Math.round(y)]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const i = (cy * canvas.width + cx) * 4;
        if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;
        if (data[i]!==tr || data[i+1]!==tg || data[i+2]!==tb || data[i+3]!==ta) continue;
        data[i]=fc.r; data[i+1]=fc.g; data[i+2]=fc.b; data[i+3]=255;
        stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
      }
      ctx.putImageData(img, 0, 0);
    }

    function hexToRGB(hex) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return {r,g,b};
    }

    canvas.addEventListener('mousedown', (e) => {
      drawing = true;
      const {x, y} = getPos(e);
      lastX = x; lastY = y;
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (tool === 'fill') {
        floodFill(x, y, color);
        drawing = false;
        return;
      }
      if (tool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          ctx.fillStyle = color;
          ctx.font = `${brushSize * 4}px Segoe UI`;
          ctx.fillText(text, x, y);
        }
        drawing = false;
        return;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const {x, y} = getPos(e);

      ctx.strokeStyle = tool === 'eraser' ? bgColor : color;
      ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'brush' || tool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else if (tool === 'line') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeRect(lastX, lastY, x-lastX, y-lastY);
      } else if (tool === 'circle') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.ellipse(lastX+(x-lastX)/2, lastY+(y-lastY)/2, Math.abs(x-lastX)/2, Math.abs(y-lastY)/2, 0, 0, Math.PI*2);
        ctx.stroke();
      }
    });

    ['mouseup', 'mouseleave'].forEach(evt => {
      canvas.addEventListener(evt, () => { drawing = false; });
    });

    // Save to FS
    document.getElementById(`paint-save-${id}`).addEventListener('click', async () => {
      const name = prompt('Save as:', 'painting.png');
      if (!name) return;
      canvas.toBlob(async (blob) => {
        await FS.writeFile('/Users/User/Pictures/' + name, blob);
        OS.notify('Paint', `Saved to Pictures: ${name}`);
      }, 'image/png');
    });

    // Download
    document.getElementById(`paint-download-${id}`).addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'painting.png';
      a.click();
    });
  },
});

/**
 * BrowserOS - Browser
 */
OS.registerApp('browser', {
  name: 'Browser',
  icon: '🌐',
  category: 'Internet',
  pinned: true,
  pinnedTaskbar: true,
  defaultWidth: 1024,
  defaultHeight: 680,
  minWidth: 500,
  minHeight: 400,
  keywords: ['web', 'internet', 'browse', 'website', 'url', 'http'],
  launch(container, winState) {
    let currentUrl = 'https://www.wikipedia.org';
    const bookmarks = [
      { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
      { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
      { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
      { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
    ];

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div class="browser-bar">
          <button id="br-back-${winState.id}" class="fe-btn" title="Back">◀</button>
          <button id="br-fwd-${winState.id}" class="fe-btn" title="Forward">▶</button>
          <button id="br-refresh-${winState.id}" class="fe-btn" title="Refresh">🔄</button>
          <button id="br-home-${winState.id}" class="fe-btn" title="Home">🏠</button>
          <input class="browser-url" id="br-url-${winState.id}" value="${currentUrl}" style="flex:1">
          <button id="br-go-${winState.id}" style="padding:0 12px;background:var(--accent);color:white;border-radius:12px;font-size:12px">Go</button>
          <button id="br-bm-${winState.id}" class="fe-btn" title="Bookmarks">⭐</button>
        </div>
        <div style="display:flex;gap:4px;padding:4px 8px;background:var(--bg-elevated);border-bottom:1px solid var(--border);flex-wrap:wrap">
          ${bookmarks.map(b => `<button class="br-bookmark" data-url="${b.url}" style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;background:rgba(255,255,255,0.06)">${b.icon} ${b.name}</button>`).join('')}
        </div>
        <div style="flex:1;position:relative;background:#fff">
          <div id="br-warning-${winState.id}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);flex-direction:column;gap:12px;z-index:2">
            <div style="font-size:40px">🌐</div>
            <div style="font-size:14px;font-weight:500">Web Browser</div>
            <div style="font-size:12px;color:var(--text-secondary);text-align:center;max-width:300px">Note: Some websites block embedding in iframes. If a site doesn't load, try opening it externally.</div>
            <button id="br-open-external-${winState.id}" style="background:var(--accent);color:white;padding:8px 20px;border-radius:8px;font-size:13px">Load Website</button>
          </div>
          <iframe id="br-frame-${winState.id}" class="browser-iframe" src="" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style="display:none;width:100%;height:100%;border:none"></iframe>
        </div>
        <div style="height:22px;background:var(--bg-elevated);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 10px;font-size:11px;color:var(--text-secondary)">
          <span id="br-status-${winState.id}">Ready</span>
        </div>
      </div>
    `;

    const id = winState.id;
    const urlInput = document.getElementById(`br-url-${id}`);
    const frame = document.getElementById(`br-frame-${id}`);
    const warning = document.getElementById(`br-warning-${id}`);
    const status = document.getElementById(`br-status-${id}`);

    function navigate(url) {
      if (!url.startsWith('http')) url = 'https://' + url;
      currentUrl = url;
      urlInput.value = url;
      status.textContent = 'Loading...';
      warning.style.display = 'none';
      frame.style.display = 'block';
      frame.src = url;
    }

    frame.addEventListener('load', () => {
      status.textContent = currentUrl;
    });

    frame.addEventListener('error', () => {
      warning.style.display = 'flex';
      frame.style.display = 'none';
    });

    document.getElementById(`br-go-${id}`).addEventListener('click', () => navigate(urlInput.value));
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(urlInput.value); });
    document.getElementById(`br-back-${id}`).addEventListener('click', () => { try { frame.contentWindow.history.back(); } catch {} });
    document.getElementById(`br-fwd-${id}`).addEventListener('click', () => { try { frame.contentWindow.history.forward(); } catch {} });
    document.getElementById(`br-refresh-${id}`).addEventListener('click', () => navigate(currentUrl));
    document.getElementById(`br-home-${id}`).addEventListener('click', () => navigate('https://www.google.com'));

    document.getElementById(`br-open-external-${id}`).addEventListener('click', () => navigate(currentUrl));

    container.querySelectorAll('.br-bookmark').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.url));
    });

    document.getElementById(`br-bm-${id}`).addEventListener('click', (e) => {
      WM.showContextMenu(e.clientX, e.clientY, [
        ...bookmarks.map(b => ({ label: b.name, icon: b.icon, action: () => navigate(b.url) })),
        { separator: true },
        { label: 'Add current page', icon: '➕', action: () => {
          const name = prompt('Bookmark name:', urlInput.value);
          if (name) bookmarks.push({ name, url: urlInput.value, icon: '🔖' });
        }},
      ]);
    });
  },
});

/**
 * BrowserOS - Media Player
 */
OS.registerApp('mediaplayer', {
  name: 'Media Player',
  icon: '🎬',
  category: 'Entertainment',
  pinned: true,
  pinnedTaskbar: true,
  defaultWidth: 700,
  defaultHeight: 520,
  minWidth: 400,
  minHeight: 350,
  keywords: ['video', 'audio', 'music', 'media', 'play', 'mp3', 'mp4'],
  fileTypes: ['mp3', 'mp4', 'webm', 'ogg', 'wav', 'flac', 'mkv', 'avi'],
  launch(container, winState, opts) {
    let playlist = [];
    let currentIdx = 0;
    let isPlaying = false;

    container.innerHTML = `
      <div class="media-player">
        <div class="media-display" id="mp-display-${winState.id}">
          <div class="media-artwork">
            <div>🎵</div>
            <div style="font-size:14px;color:var(--text-secondary)">No media loaded</div>
          </div>
        </div>
        <div class="media-controls">
          <div class="media-title" id="mp-title-${winState.id}">No media</div>
          <input type="range" class="media-progress" id="mp-progress-${winState.id}" value="0" min="0" max="100" step="0.1">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:8px">
            <span id="mp-curr-${winState.id}">0:00</span>
            <span id="mp-dur-${winState.id}">0:00</span>
          </div>
          <div class="media-buttons">
            <div class="media-btn" id="mp-prev-${winState.id}" title="Previous">⏮</div>
            <div class="media-btn play-btn" id="mp-play-${winState.id}" title="Play/Pause">▶</div>
            <div class="media-btn" id="mp-next-${winState.id}" title="Next">⏭</div>
            <div class="media-btn" id="mp-vol-${winState.id}" title="Volume">🔊</div>
            <input type="range" id="mp-vol-slider-${winState.id}" min="0" max="100" value="80" style="width:60px;height:4px;appearance:none;background:rgba(255,255,255,0.2);border:none;padding:0">
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button id="mp-open-${winState.id}" style="flex:1;background:var(--accent);color:white;border-radius:8px;padding:6px;font-size:12px">📂 Open File</button>
            <button id="mp-playlist-${winState.id}" style="flex:1;background:rgba(255,255,255,0.07);border-radius:8px;padding:6px;font-size:12px;color:var(--text-secondary)">🎵 Playlist (${playlist.length})</button>
          </div>
        </div>
      </div>
    `;

    const id = winState.id;
    let mediaEl = null;

    function createMedia(src, mime, name) {
      const display = document.getElementById(`mp-display-${id}`);
      display.innerHTML = '';
      const isVideo = mime.startsWith('video/');
      mediaEl = document.createElement(isVideo ? 'video' : 'audio');
      mediaEl.src = src;
      mediaEl.style.maxWidth = '100%';
      mediaEl.style.maxHeight = '100%';
      if (!isVideo) {
        display.innerHTML = `<div class="media-artwork"><div style="font-size:80px">🎵</div><div style="font-size:14px;color:var(--text-secondary)">${name}</div></div>`;
        document.body.appendChild(mediaEl);
      } else {
        mediaEl.controls = false;
        display.appendChild(mediaEl);
      }

      document.getElementById(`mp-title-${id}`).textContent = name;

      const progress = document.getElementById(`mp-progress-${id}`);
      const curr = document.getElementById(`mp-curr-${id}`);
      const dur = document.getElementById(`mp-dur-${id}`);

      mediaEl.addEventListener('timeupdate', () => {
        if (mediaEl.duration) {
          progress.value = (mediaEl.currentTime / mediaEl.duration) * 100;
          curr.textContent = formatTime(mediaEl.currentTime);
          dur.textContent = formatTime(mediaEl.duration);
        }
      });

      mediaEl.addEventListener('ended', () => {
        document.getElementById(`mp-play-${id}`).textContent = '▶';
        isPlaying = false;
        if (currentIdx < playlist.length - 1) {
          currentIdx++;
          playItem(currentIdx);
        }
      });

      progress.addEventListener('input', () => {
        if (mediaEl.duration) mediaEl.currentTime = (progress.value / 100) * mediaEl.duration;
      });
    }

    function formatTime(s) {
      const m = Math.floor(s / 60);
      return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    }

    async function playItem(idx) {
      if (idx < 0 || idx >= playlist.length) return;
      currentIdx = idx;
      const item = playlist[idx];
      let src;
      if (item.path) {
        const blob = await FS.readFile(item.path);
        src = URL.createObjectURL(blob);
      } else {
        src = item.src;
      }
      createMedia(src, item.mime, item.name);
      mediaEl.play();
      isPlaying = true;
      document.getElementById(`mp-play-${id}`).textContent = '⏸';
    }

    document.getElementById(`mp-play-${id}`).addEventListener('click', () => {
      if (!mediaEl) return;
      if (isPlaying) { mediaEl.pause(); document.getElementById(`mp-play-${id}`).textContent = '▶'; }
      else { mediaEl.play(); document.getElementById(`mp-play-${id}`).textContent = '⏸'; }
      isPlaying = !isPlaying;
    });

    document.getElementById(`mp-prev-${id}`).addEventListener('click', () => playItem(currentIdx - 1));
    document.getElementById(`mp-next-${id}`).addEventListener('click', () => playItem(currentIdx + 1));

    document.getElementById(`mp-vol-slider-${id}`).addEventListener('input', (e) => {
      if (mediaEl) mediaEl.volume = e.target.value / 100;
    });

    document.getElementById(`mp-open-${id}`).addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'audio/*,video/*'; inp.multiple = true;
      inp.addEventListener('change', async () => {
        for (const file of inp.files) {
          const path = await FS.importFile(file);
          playlist.push({ path, name: file.name, mime: file.type });
        }
        document.getElementById(`mp-playlist-${id}`).textContent = `🎵 Playlist (${playlist.length})`;
        if (playlist.length === 1 || !isPlaying) playItem(playlist.length - 1);
      });
      inp.click();
    });

    document.getElementById(`mp-playlist-${id}`).addEventListener('click', (e) => {
      if (playlist.length === 0) { OS.notify('Media Player', 'Playlist is empty'); return; }
      WM.showContextMenu(e.clientX, e.clientY, playlist.map((item, i) => ({
        label: item.name, icon: i === currentIdx ? '▶' : '🎵',
        action: () => playItem(i),
      })));
    });

    // Auto-load file if passed
    if (opts?.file?.path) {
      playlist.push({ path: opts.file.path, name: opts.file.name, mime: FS.guessMime(opts.file.name) });
      playItem(0);
    }
  },
});

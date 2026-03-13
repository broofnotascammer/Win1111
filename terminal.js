/**
 * BrowserOS - Terminal
 */

OS.registerApp('terminal', {
  name: 'Terminal',
  icon: '⬛',
  category: 'System',
  pinned: true,
  defaultWidth: 720,
  defaultHeight: 460,
  minWidth: 400,
  minHeight: 260,
  keywords: ['cmd', 'command', 'shell', 'bash', 'console', 'terminal'],
  launch(container, winState, opts) {
    let cwd = '/Users/User';
    const history = [];
    let histIdx = -1;

    container.innerHTML = `
      <div class="terminal-body" id="term-${winState.id}" style="display:flex;flex-direction:column;height:100%;font-size:13px">
        <div id="term-output-${winState.id}" style="flex:1;overflow-y:auto;padding:8px 10px;"></div>
        <div class="terminal-input-row" style="padding:4px 10px 8px">
          <span class="terminal-prompt" id="term-prompt-${winState.id}">user@browseros:~$</span>
          <input class="terminal-input" id="term-input-${winState.id}" autocomplete="off" spellcheck="false">
        </div>
      </div>
    `;

    const id = winState.id;
    const outputEl = document.getElementById(`term-output-${id}`);
    const inputEl = document.getElementById(`term-input-${id}`);
    const promptEl = document.getElementById(`term-prompt-${id}`);

    function print(text, cls = '') {
      const div = document.createElement('div');
      div.className = 'terminal-output ' + cls;
      div.textContent = text;
      outputEl.appendChild(div);
      outputEl.scrollTop = outputEl.scrollHeight;
    }

    function printHTML(html) {
      const div = document.createElement('div');
      div.className = 'terminal-output';
      div.innerHTML = html;
      outputEl.appendChild(div);
      outputEl.scrollTop = outputEl.scrollHeight;
    }

    function updatePrompt() {
      const home = '/Users/User';
      const display = cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd;
      promptEl.textContent = `user@browseros:${display}$`;
    }

    // Welcome
    print('BrowserOS Terminal [Version 1.0.0]', 'system');
    print('(c) BrowserOS. All rights reserved.', 'system');
    print('');
    print('Type "help" for available commands.', 'info');
    print('');

    inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const cmd = inputEl.value.trim();
        if (!cmd) return;
        history.unshift(cmd);
        histIdx = -1;
        print(`${promptEl.textContent} ${cmd}`);
        inputEl.value = '';
        await runCommand(cmd);
      }
      if (e.key === 'ArrowUp') {
        histIdx = Math.min(histIdx + 1, history.length - 1);
        inputEl.value = history[histIdx] || '';
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        histIdx = Math.max(histIdx - 1, -1);
        inputEl.value = histIdx === -1 ? '' : history[histIdx];
        e.preventDefault();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        await autocomplete(inputEl.value);
      }
      if (e.ctrlKey && e.key === 'c') {
        print('^C');
        inputEl.value = '';
      }
      if (e.ctrlKey && e.key === 'l') {
        outputEl.innerHTML = '';
        e.preventDefault();
      }
    });

    async function autocomplete(input) {
      const parts = input.split(' ');
      const partial = parts[parts.length - 1];
      if (!partial) return;

      try {
        const entries = await FS.readDir(cwd);
        const matches = entries.filter(e => e.name.startsWith(partial));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0].name + (matches[0].type === 'directory' ? '/' : '');
          inputEl.value = parts.join(' ');
        } else if (matches.length > 1) {
          print(matches.map(m => m.name).join('  '), 'info');
        }
      } catch {}
    }

    async function runCommand(input) {
      const parts = parseArgs(input);
      const cmd = parts[0];
      const args = parts.slice(1);

      const commands = {
        help() {
          const cmds = [
            ['help', 'Show this help'],
            ['ls [path]', 'List directory contents'],
            ['dir [path]', 'Same as ls'],
            ['cd <path>', 'Change directory'],
            ['pwd', 'Print working directory'],
            ['mkdir <name>', 'Create directory'],
            ['touch <name>', 'Create empty file'],
            ['echo <text>', 'Print text'],
            ['cat <file>', 'Show file contents'],
            ['rm <path>', 'Remove file or directory'],
            ['mv <src> <dest>', 'Move/rename'],
            ['cp <src> <dest>', 'Copy file'],
            ['find <query>', 'Search files'],
            ['clear', 'Clear terminal'],
            ['whoami', 'Show current user'],
            ['date', 'Show current date/time'],
            ['sysinfo', 'System information'],
            ['open <app>', 'Launch an application'],
            ['write <file>', 'Open file in Notepad'],
            ['history', 'Show command history'],
            ['neofetch', 'System info (fancy)'],
          ];
          print('Available commands:', 'info');
          cmds.forEach(([c, d]) => print(`  ${c.padEnd(22)} ${d}`, ''));
        },

        async ls() {
          const path = args[0] ? resolvePath(args[0]) : cwd;
          try {
            const entries = await FS.readDir(path);
            if (entries.length === 0) { print('(empty)'); return; }
            const dirs = entries.filter(e => e.type === 'directory');
            const files = entries.filter(e => e.type === 'file');
            if (dirs.length) print('Directories: ' + dirs.map(d => d.name + '/').join('  '), 'info');
            if (files.length) print('Files: ' + files.map(f => f.name).join('  '));
          } catch(e) { print('ls: ' + path + ': No such directory', 'error'); }
        },

        async cd() {
          const target = args[0] || '/Users/User';
          const newPath = target === '~' ? '/Users/User' : resolvePath(target);
          try {
            const entry = await FS.stat(newPath);
            if (!entry || entry.type !== 'directory') { print(`cd: ${target}: Not a directory`, 'error'); return; }
            cwd = newPath;
            updatePrompt();
          } catch { print(`cd: ${target}: No such directory`, 'error'); }
        },

        pwd() { print(cwd); },

        async mkdir() {
          if (!args[0]) { print('mkdir: missing operand', 'error'); return; }
          const path = resolvePath(args[0]);
          await FS.mkdir(path);
          print(`Directory created: ${path}`, 'success');
        },

        async touch() {
          if (!args[0]) { print('touch: missing file name', 'error'); return; }
          const path = resolvePath(args[0]);
          const blob = new Blob([''], { type: 'text/plain' });
          await FS.writeFile(path, blob);
          print(`Created: ${path}`, 'success');
        },

        echo() { print(args.join(' ')); },

        async cat() {
          if (!args[0]) { print('cat: missing file name', 'error'); return; }
          const path = resolvePath(args[0]);
          try {
            const text = await FS.readText(path);
            text.split('\n').forEach(line => print(line));
          } catch { print(`cat: ${args[0]}: No such file`, 'error'); }
        },

        async rm() {
          if (!args[0]) { print('rm: missing operand', 'error'); return; }
          const path = resolvePath(args[0]);
          try {
            await FS.deleteEntry(path);
            print(`Removed: ${path}`, 'success');
          } catch { print(`rm: cannot remove '${args[0]}'`, 'error'); }
        },

        async mv() {
          if (!args[1]) { print('mv: missing destination', 'error'); return; }
          await FS.rename(resolvePath(args[0]), resolvePath(args[1]));
          print(`Moved to: ${args[1]}`, 'success');
        },

        async cp() {
          if (!args[1]) { print('cp: missing destination', 'error'); return; }
          await FS.copy(resolvePath(args[0]), resolvePath(args[1]));
          print(`Copied to: ${args[1]}`, 'success');
        },

        async find() {
          if (!args[0]) { print('find: missing query', 'error'); return; }
          const results = await FS.search(args[0]);
          if (results.length === 0) { print('No results found', 'info'); return; }
          results.forEach(r => print(r.path));
        },

        clear() { outputEl.innerHTML = ''; },

        whoami() { print(OS.getSetting('username') || 'user'); },

        date() { print(new Date().toString()); },

        sysinfo() {
          print(`BrowserOS v${OS.version}`, 'info');
          print(`Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
          print(`Platform: ${navigator.platform}`);
          print(`Language: ${navigator.language}`);
          print(`Cores: ${navigator.hardwareConcurrency || 'Unknown'}`);
          print(`Memory: ${(navigator.deviceMemory || '?')} GB`);
          print(`Screen: ${screen.width}x${screen.height}`);
        },

        open() {
          const appId = args[0];
          if (!appId) { print('open: specify app name', 'error'); return; }
          const app = OS.getApp(appId);
          if (app) { WM.launch(appId); print(`Launched: ${app.name}`, 'success'); }
          else { print(`open: ${appId}: application not found`, 'error'); }
        },

        write() {
          if (!args[0]) { print('write: specify file path', 'error'); return; }
          const path = resolvePath(args[0]);
          WM.launch('notepad', { file: { path, name: FS.basename(path) } });
          print(`Opening ${args[0]} in Notepad...`, 'info');
        },

        history() {
          history.forEach((cmd, i) => print(`  ${String(i + 1).padStart(3)}  ${cmd}`));
        },

        neofetch() {
          const logo = [
            '           ██████████████████████',
            '       ██████████████████████████████',
            '     ██████████████  ████  ████████████',
            '    ████████████  ████  ████  ██████████',
            '   ██████████████████████████████████████',
            '   ████████  ████████████  ██████████████',
            '   ████████  ████████████  ██████████████',
            '   ██████████████████████████████████████',
            '    ████████████  ████  ████  ██████████',
            '     ██████████████  ████  ████████████',
            '       ██████████████████████████████',
            '           ██████████████████████',
          ];
          const info = [
            `<span style="color:#75beff">user</span>@<span style="color:#75beff">browseros</span>`,
            '─────────────────',
            `<span style="color:#75beff">OS:</span> BrowserOS v${OS.version}`,
            `<span style="color:#75beff">Host:</span> ${location.hostname}`,
            `<span style="color:#75beff">Shell:</span> BrowserOS Terminal`,
            `<span style="color:#75beff">Browser:</span> ${navigator.userAgent.split('/')[0]}`,
            `<span style="color:#75beff">Resolution:</span> ${screen.width}x${screen.height}`,
            `<span style="color:#75beff">CPU:</span> ${navigator.hardwareConcurrency || '?'} cores`,
            `<span style="color:#75beff">Memory:</span> ${navigator.deviceMemory || '?'} GB`,
            `<span style="color:#75beff">Lang:</span> ${navigator.language}`,
          ];
          logo.forEach((line, i) => {
            printHTML(`<span style="color:#0078d4">${line}</span>${i < info.length ? '   ' + info[i] : ''}`);
          });
        },
      };

      commands.dir = commands.ls;

      const fn = commands[cmd];
      if (fn) {
        await fn();
      } else if (cmd) {
        print(`'${cmd}' is not recognized as a command. Type 'help'.`, 'error');
      }
    }

    function resolvePath(p) {
      if (p.startsWith('/')) return FS.normalizePath(p);
      if (p === '~') return '/Users/User';
      if (p === '..') return FS.dirname(cwd);
      if (p === '.') return cwd;
      return FS.normalizePath(cwd + '/' + p);
    }

    function parseArgs(input) {
      const parts = [];
      let current = '';
      let inQuote = false;
      for (const char of input) {
        if (char === '"' || char === "'") { inQuote = !inQuote; }
        else if (char === ' ' && !inQuote) { if (current) { parts.push(current); current = ''; } }
        else current += char;
      }
      if (current) parts.push(current);
      return parts;
    }

    updatePrompt();
    setTimeout(() => inputEl.focus(), 100);
  },
});

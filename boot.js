/**
 * BrowserOS Boot Sequence
 * Initializes all subsystems in order
 */

(async function boot() {
  'use strict';

  const bootScreen   = document.getElementById('boot-screen');
  const lockScreen   = document.getElementById('lock-screen');
  const desktop      = document.getElementById('desktop');

  // Phase 1: Boot animation
  await sleep(2400);

  // Phase 2: Init filesystem
  try { await FS.init(); } catch(e) { console.error('FS init failed:', e); }

  await sleep(600);

  // Phase 3: Fade boot screen out
  bootScreen.style.transition = 'opacity 500ms';
  bootScreen.style.opacity = '0';
  await sleep(520);
  bootScreen.style.display = 'none';

  // Phase 4: Lock screen
  lockScreen.style.display = 'block';
  lockScreen.style.opacity = '0';
  lockScreen.style.transition = 'opacity 350ms';
  await sleep(30);
  lockScreen.style.opacity = '1';
  updateLockClock();
  setInterval(updateLockClock, 15000);

  // Phase 5: Unlock handlers
  let unlocked = false;
  async function unlock() {
    if (unlocked) return;
    unlocked = true;
    lockScreen.style.transition = 'opacity 350ms, transform 350ms';
    lockScreen.style.opacity = '0';
    lockScreen.style.transform = 'translateY(-16px)';
    await sleep(370);
    lockScreen.style.display = 'none';
    await startDesktop();
  }

  lockScreen.addEventListener('click', unlock);
  document.addEventListener('keydown', (e) => {
    if (!unlocked && e.key !== 'F12' && e.key !== 'Tab') unlock();
  });
})();

function updateLockClock() {
  const now  = new Date();
  const t    = document.getElementById('lock-time');
  const d    = document.getElementById('lock-date');
  if (t) t.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d) d.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────
//  Desktop startup
// ─────────────────────────────────────────────
async function startDesktop() {
  const desktop = document.getElementById('desktop');
  desktop.style.display = 'block';
  desktop.style.opacity = '0';
  desktop.style.transition = 'opacity 400ms';

  // Init subsystems
  Desktop.init();
  Taskbar.init();

  await sleep(30);
  desktop.style.opacity = '1';

  // Welcome notification after a moment
  await sleep(1200);
  OS.notify('BrowserOS', 'Welcome! Right-click the desktop to get started.');

  // Restore wallpaper brightness
  const brightness = OS.getSetting('brightness') || 85;
  document.getElementById('wallpaper').style.filter = `brightness(${brightness / 100})`;
}

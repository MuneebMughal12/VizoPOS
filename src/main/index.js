const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const { initDatabase, getMeta } = require('./db');
const { registerIpc } = require('./ipc');
const { dbPath } = require('./paths');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;

// Splash timing: always visible at least MIN so it never blinks, and the
// handover is forced at MAX so a slow start can never leave it hanging.
const SPLASH_MIN_MS = 1400;
const SPLASH_MAX_MS = 5000;

function createSplash() {
  const splash = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    resizable: false,
    center: true,
    show: false,
    skipTaskbar: true,
    backgroundColor: '#12121C',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  splash.loadFile(path.join(__dirname, 'splash', 'splash.html'), {
    query: { v: app.getVersion() },
  });
  splash.once('ready-to-show', () => {
    if (!splash.isDestroyed()) splash.show();
  });
  return splash;
}

// Soft fade (~200ms), then close. Never both windows at once:
// the main window is shown only after the splash has fully closed.
function fadeOutAndClose(win, done) {
  if (win.isDestroyed()) {
    done();
    return;
  }
  let opacity = 1;
  const timer = setInterval(() => {
    opacity -= 0.1;
    if (win.isDestroyed()) {
      clearInterval(timer);
      done();
      return;
    }
    if (opacity <= 0) {
      clearInterval(timer);
      win.close();
      done();
    } else {
      win.setOpacity(opacity);
    }
  }, 20);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 768,
    backgroundColor: '#12121C',
    title: 'Vizo POS',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (DEV_URL) {
    win.loadURL(DEV_URL);
    win.webContents.on('before-input-event', (_e, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
        win.webContents.toggleDevTools();
      }
    });
  } else {
    win.loadFile(path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html'));
  }
  return win;
}

app.whenReady().then(() => {
  // Smoke mode: verify DB + native module load without opening any window.
  if (process.env.VIZO_SMOKE) {
    initDatabase();
    console.log('[smoke] db path:', dbPath());
    console.log('[smoke] schema_version:', getMeta('schema_version'));
    app.quit();
    return;
  }

  const startedAt = Date.now();
  const splash = createSplash();
  let booted = false;

  const boot = () => {
    if (booted) return;
    booted = true;

    initDatabase();
    registerIpc();
    const win = createWindow();

    let handedOver = false;
    const handover = () => {
      if (handedOver) return;
      handedOver = true;
      fadeOutAndClose(splash, () => {
        if (!win.isDestroyed()) win.show();
      });
    };

    win.once('ready-to-show', () => {
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - startedAt));
      setTimeout(handover, wait);
    });
    // Failsafe: hand over no matter what after SPLASH_MAX_MS.
    setTimeout(handover, Math.max(0, SPLASH_MAX_MS - (Date.now() - startedAt)));

    if (process.env.VIZO_SPLASH_TEST) {
      win.once('show', () => {
        console.log('[splash-test] main shown at +' + (Date.now() - startedAt) + 'ms');
        setTimeout(() => app.quit(), 500);
      });
    }
  };

  // Let the splash paint first, then run the (synchronous) DB init.
  splash.once('ready-to-show', () => setTimeout(boot, 80));
  // Failsafe: boot even if the splash never reports ready.
  setTimeout(boot, 900);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow().show();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

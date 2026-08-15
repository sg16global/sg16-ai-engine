/**
 * Cursor Junior desktop — on the PC road, like Cursor.
 * Public window title stays SG16. Owner name is Cursor Junior.
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const HOUSE_URL = (() => {
  const raw = process.env.SG16_JUNIOR_URL?.trim() || 'http://localhost:5173';
  const base = raw.replace(/\/+$/, '');
  if (/\/developer$/i.test(base)) return base;
  return `${base}/developer`;
})();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050507',
    title: 'SG16 Personal Developer',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(HOUSE_URL);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

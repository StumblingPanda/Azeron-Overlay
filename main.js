import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

let pythonProcess;

function startPythonBackend() {
    // Kill anything left over on port 8765 from a previous crashed session
    const cleanup = spawn('powershell', [
        '-Command',
        'Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }'
    ]);
    cleanup.on('close', () => {
        const [cmd, args] = app.isPackaged
            ? [path.join(process.resourcesPath, 'listener.exe'), []]
            : ['python', ['listener.py']];

        pythonProcess = spawn(cmd, args);
        pythonProcess.stdout.on('data', (data) => console.log(`Python: ${data}`));
        pythonProcess.stderr.on('data', (data) => console.error(`Python Error: ${data}`));
        pythonProcess.on('close', (code) => console.log(`Python process exited with code ${code}`));
    });
}

let win;

function createWindow() {
    const primary = screen.getPrimaryDisplay();
    win = new BrowserWindow({
        x: primary.bounds.x,
        y: primary.bounds.y,
        width:  primary.bounds.width,
        height: primary.bounds.height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    startPythonBackend();
    createWindow();
    globalShortcut.register('F8', () => win?.webContents.send('global-key', 'F8'));
    globalShortcut.register('F9', () => win?.webContents.send('global-key', 'F9'));

    if (app.isPackaged) {
        autoUpdater.on('update-available',   () => win?.webContents.send('update-status', 'available'));
        autoUpdater.on('update-downloaded',  () => win?.webContents.send('update-status', 'ready'));
        autoUpdater.on('download-progress',  (p) => win?.webContents.send('update-status', `downloading:${Math.round(p.percent)}`));
        autoUpdater.on('error', (err) => { console.error('AutoUpdater error:', err); win?.webContents.send('update-status', `error:${err.message}`); });
        // Check for updates 5 seconds after launch so the window is ready
        setTimeout(() => autoUpdater.checkForUpdates(), 5000);
    }
});

ipcMain.on("set-clickthrough", (_event, ignoreMouse) => {
    win.setIgnoreMouseEvents(ignoreMouse, { forward: true });
});

ipcMain.handle("get-displays", () => {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().map(d => ({
        id:        d.id,
        bounds:    d.bounds,
        scaleFactor: d.scaleFactor,
        isPrimary: d.id === primary.id,
    }));
});

ipcMain.handle("move-to-display", (_event, displayId) => {
    const d = screen.getAllDisplays().find(d => d.id === displayId);
    if (!d) return null;
    win.setBounds({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height });
    return d.bounds;
});

ipcMain.on("install-update", () => { if (app.isPackaged) autoUpdater.quitAndInstall(); });
ipcMain.on("retry-update",   () => { if (app.isPackaged) autoUpdater.checkForUpdates(); });
ipcMain.handle('get-version', () => app.getVersion());

function prefsPath() {
    return path.join(app.getPath('userData'), 'prefs.json');
}
ipcMain.handle('get-prefs', () => {
    try { return JSON.parse(fs.readFileSync(prefsPath(), 'utf8')); } catch { return {}; }
});
ipcMain.on('set-pref', (_e, key, value) => {
    try {
        let prefs = {};
        try { prefs = JSON.parse(fs.readFileSync(prefsPath(), 'utf8')); } catch {}
        prefs[key] = value;
        fs.mkdirSync(path.dirname(prefsPath()), { recursive: true });
        fs.writeFileSync(prefsPath(), JSON.stringify(prefs));
    } catch (e) { console.error('Failed to write prefs:', e); }
});

function killPython() {
    if (!pythonProcess) return;
    spawn('taskkill', ['/F', '/T', '/PID', String(pythonProcess.pid)]);
    pythonProcess = null;
}

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => { globalShortcut.unregisterAll(); killPython(); });
process.on('SIGINT',  () => { killPython(); process.exit(0); });
process.on('SIGTERM', () => { killPython(); process.exit(0); });

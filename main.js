import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const log = require('electron-log/main');

log.initialize();
log.transports.file.level = 'info';
log.info('App starting');

process.on('uncaughtException',  (err)    => { log.error('Uncaught exception:',   err);    app.quit(); });
process.on('unhandledRejection', (reason) => { log.error('Unhandled rejection:', reason); });

// Windows' native window-occlusion tracking misjudges this always-on-top transparent
// overlay as "occluded" whenever it isn't the OS-focused window on its monitor — common
// on secondary displays — and Chromium throttles rendering for windows it thinks are
// hidden. That causes key highlights to silently miss a repaint or get stuck until
// something else wakes the renderer up. Must be set before app is ready.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

let pythonProcess;
// Set the moment quit begins. startPythonBackend's spawn happens inside an async
// callback (after the port-8765 cleanup command finishes) — if the app is closed fast
// enough to quit before that callback runs, killPython() would find pythonProcess still
// unset and do nothing, while the backend then spawns anyway a moment later with nothing
// left tracking or killing it: a permanently orphaned process holding port 8765 for the
// rest of the session. Checking this flag in that callback closes the race.
let quitting = false;

function startPythonBackend() {
    // Kill anything left over on port 8765 from a previous crashed session
    const cleanup = spawn('powershell', [
        '-Command',
        'Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }'
    ]);
    cleanup.on('close', () => {
        if (quitting) return;
        const [cmd, args] = app.isPackaged
            ? [path.join(process.resourcesPath, 'listener.exe'), []]
            : ['python', ['listener.py']];

        pythonProcess = spawn(cmd, args);
        pythonProcess.stdout.on('data', (data) => log.info(`Python: ${data.toString().trim()}`));
        pythonProcess.stderr.on('data', (data) => log.error(`Python Error: ${data.toString().trim()}`));
        pythonProcess.on('close', (code) => log.warn(`Python process exited with code ${code}`));
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
        webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false }
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

function manualProfilesDir(deviceId) {
    return path.join(app.getPath('userData'), 'manual-profiles', String(deviceId).replace(/[^a-z0-9_-]/gi, '_'));
}

function manualProfileFile(deviceId, name) {
    const safeName = String(name).replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 60);
    return safeName ? path.join(manualProfilesDir(deviceId), safeName + '.json') : null;
}

ipcMain.handle('list-manual-profiles', (_e, deviceId) => {
    try {
        const dir = manualProfilesDir(deviceId);
        return fs.readdirSync(dir)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
                catch { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch { return []; }
});

ipcMain.handle('save-manual-profile', (_e, deviceId, profile) => {
    const file = manualProfileFile(deviceId, profile?.name);
    if (!file) return { ok: false, error: 'Invalid profile name.' };
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ ...profile, savedAt: Date.now() }));
        return { ok: true };
    } catch (e) {
        log.error('Failed to save manual profile:', e);
        return { ok: false, error: 'Failed to write profile file.' };
    }
});

ipcMain.handle('delete-manual-profile', (_e, deviceId, name) => {
    const file = manualProfileFile(deviceId, name);
    if (!file) return { ok: false, error: 'Invalid profile name.' };
    try {
        fs.rmSync(file, { force: true });
        return { ok: true };
    } catch (e) {
        log.error('Failed to delete manual profile:', e);
        return { ok: false, error: 'Failed to delete profile file.' };
    }
});

function killPython() {
    if (!pythonProcess) return Promise.resolve();
    const pid = pythonProcess.pid;
    pythonProcess = null;
    // will-quit/before-quit don't wait for anything — spawning taskkill and moving on
    // let Electron's own process disappear before taskkill.exe had necessarily even
    // started, let alone finished, for it to actually kill the target PID. Wait for it
    // (bounded by a timeout, in case taskkill itself hangs) so the backend is confirmed
    // gone before we let the app finish quitting.
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, 3000);
        const tk = spawn('taskkill', ['/F', '/T', '/PID', String(pid)]);
        const done = () => { clearTimeout(timer); resolve(); };
        tk.on('close', done);
        tk.on('error', done);
    });
}

app.on('window-all-closed', () => app.quit());

// preventDefault + app.exit() makes shutdown deterministic: quit no longer proceeds
// (and takes the whole process down with it) until the backend is actually confirmed
// killed. The `quitting` guard makes this idempotent in case something else (e.g. the
// uncaughtException handler above) calls app.quit() again while cleanup is still
// in flight — without it, that second call would re-enter this handler and race a
// second killPython()/app.exit() against the first.
app.on('before-quit', (event) => {
    if (quitting) return;
    quitting = true;
    event.preventDefault();
    globalShortcut.unregisterAll();
    killPython().finally(() => app.exit());
});
process.on('SIGINT',  () => { quitting = true; killPython().finally(() => process.exit(0)); });
process.on('SIGTERM', () => { quitting = true; killPython().finally(() => process.exit(0)); });

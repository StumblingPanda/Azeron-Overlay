import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import { spawn } from 'child_process';

let pythonProcess;

function startPythonBackend() {
    pythonProcess = spawn('python', ['listener.py']);
    pythonProcess.stdout.on('data', (data) => console.log(`Python: ${data}`));
    pythonProcess.stderr.on('data', (data) => console.error(`Python Error: ${data}`));
    pythonProcess.on('close', (code) => console.log(`Python process exited with code ${code}`));
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
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    startPythonBackend();
    createWindow();
    globalShortcut.register('F8', () => win?.webContents.send('global-key', 'F8'));
    globalShortcut.register('F9', () => win?.webContents.send('global-key', 'F9'));
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

function killPython() {
    if (!pythonProcess) return;
    spawn('taskkill', ['/F', '/T', '/PID', String(pythonProcess.pid)]);
    pythonProcess = null;
}

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => { globalShortcut.unregisterAll(); killPython(); });
process.on('SIGINT',  () => { killPython(); process.exit(0); });
process.on('SIGTERM', () => { killPython(); process.exit(0); });

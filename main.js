/* ============================================================
   CO-WRITING LLM DASHBOARD - main process
   Frameless window sized to the exact bounds of the target panel.
   IPC bridge: read-doc / write-doc, open-doc, open-folder, llm-chat,
   and llm-models. No watcher and no polling; the renderer reads on demand.
   ============================================================ */
const { app, BrowserWindow, screen, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

const TARGET_X = parseInt(process.env.FOUNDRY_TARGET_X || '3440', 10);
const WINDOWED = process.argv.includes('--windowed');
const DOC_PATH = path.join(__dirname, 'co-writing.md');

let mainWindow = null;

function logDisplays() {
  const primaryId = screen.getPrimaryDisplay().id;
  const info = screen.getAllDisplays().map((d, i) => ({
    index: i, id: d.id, primary: d.id === primaryId,
    bounds: d.bounds, size: d.size, workArea: d.workArea,
    rotation: d.rotation, scaleFactor: d.scaleFactor, internal: d.internal
  }));
  console.log('[co-writing] displays detected:\n' + JSON.stringify(info, null, 2));
  try { fsSync.writeFileSync(path.join(__dirname, 'displays-detected.json'), JSON.stringify(info, null, 2)); } catch {}
  return info;
}

function pickTargetDisplay() {
  const displays = screen.getAllDisplays();
  const idx = parseInt(process.env.FOUNDRY_TARGET_DISPLAY ?? '', 10);
  if (!Number.isNaN(idx) && displays[idx]) return displays[idx];

  const sig = displays.find(d => {
    const { width: w, height: h } = d.bounds;
    return (w === 1440 && h === 2560) || (w === 2560 && h === 1440);
  });
  if (sig) return sig;

  const byX = displays.find(d => d.bounds.x >= TARGET_X);
  if (byX) return byX;

  const primaryId = screen.getPrimaryDisplay().id;
  return displays.find(d => d.id !== primaryId) || displays[displays.length - 1];
}

function createWindow() {
  const base = {
    frame: false, resizable: false, movable: false, alwaysOnTop: true,
    backgroundColor: '#04070d',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true }
  };

  if (WINDOWED) {
    mainWindow = new BrowserWindow({ ...base, width: 480, height: 854, frame: true, resizable: true, movable: true, alwaysOnTop: false });
  } else {
    const t = pickTargetDisplay();
    const b = t.bounds;
    console.log(`[co-writing] target display id=${t.id} bounds=${JSON.stringify(b)} rotation=${t.rotation} scale=${t.scaleFactor}`);
    mainWindow = new BrowserWindow({ ...base, x: b.x, y: b.y, width: b.width, height: b.height });
    const enforce = () => { try { mainWindow.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height }); } catch {} };
    mainWindow.once('ready-to-show', enforce);
    mainWindow.webContents.once('did-finish-load', enforce);
    if (process.env.FOUNDRY_FULLSCREEN === '1') mainWindow.setFullScreen(true);
  }

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => (mainWindow = null));
}

ipcMain.handle('doc-path', () => DOC_PATH);
ipcMain.handle('open-doc', async () => {
  try { const e = await shell.openPath(DOC_PATH); return e ? { ok: false, error: e } : { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('open-url', async (_e, url) => {
  if (!/^https?:\/\//.test(url)) return { ok: false, error: 'invalid URL' };
  try { await shell.openExternal(url); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('open-folder', async () => {
  try { const e = await shell.openPath(__dirname); return e ? { ok: false, error: e } : { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('read-doc', async () => {
  try { return { ok: true, content: await fs.readFile(DOC_PATH, 'utf8') }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('write-doc', async (_e, content) => {
  try { await fs.writeFile(DOC_PATH, String(content ?? ''), 'utf8'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('llm-chat', async (_e, opts) => {
  const { baseURL, apiKey, model, temperature, system, user } = opts || {};
  try {
    const url = `${(baseURL || 'http://localhost:1234/v1').replace(/\/+$/, '')}/chat/completions`;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey || 'lm-studio'}` };
    if (/openrouter\.ai/i.test(url)) {
      headers['HTTP-Referer'] = 'https://sparklesnap.dev';
      headers['X-Title'] = 'SparkleSnap Co-Writing';
    }
    const res = await fetch(url, {
      method: 'POST', headers,
      body: JSON.stringify({
        model: model || 'local-model',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: typeof temperature === 'number' ? temperature : 0.4,
        stream: false
      })
    });
    if (!res.ok) return { ok: false, error: `LLM HTTP ${res.status}: ${(await res.text()).slice(0, 240)}` };
    const data = await res.json();
    return { ok: true, text: data?.choices?.[0]?.message?.content ?? '' };
  } catch (e) {
    return { ok: false, error: `${e.message} - is your OpenAI-compatible server running?` };
  }
});

ipcMain.handle('llm-models', async (_e, opts) => {
  const { baseURL, apiKey } = opts || {};
  try {
    const url = `${(baseURL || 'http://localhost:1234/v1').replace(/\/+$/, '')}/models`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey || 'lm-studio'}` } });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, models: (data?.data || []).map(m => m.id) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(() => {
  logDisplays();
  createWindow();
  globalShortcut.register('Escape', () => app.quit());
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

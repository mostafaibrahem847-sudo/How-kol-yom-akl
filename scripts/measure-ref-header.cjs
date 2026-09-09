const http = require('http');
const os = require('os');
const { join, extname } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { readFile } = require('fs/promises');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(process.cwd(), 'stitch-screens', p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('nf'); }
});
(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/home.html`;
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${join(os.tmpdir(), 'pi-preview-' + process.pid)}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const devtoolsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const to = setTimeout(() => reject(new Error('timeout')), 20000);
    proc.stderr.on('data', (d) => { buf += d.toString(); const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(to); resolve(m[1]); } });
    proc.on('exit', () => reject(new Error('exit')));
  });
  const list = await new Promise((res, rej) => http.get({ host: '127.0.0.1', port: new URL(devtoolsUrl).port, path: '/json/list' }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.on('open', r));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 6000));
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width), y: Math.round(r.top), h: Math.round(r.height) }; };
        const header = document.querySelector('header');
        const all = [...document.querySelectorAll('header *')];
        const pot = all.find(e => (e.textContent || '').trim() === 'soup_kitchen');
        const title = all.find(e => (e.textContent || '').trim() === 'هو كل يوم أكل');
        const home = all.find(e => (e.textContent || '').trim() === 'Home');
        const bell = document.querySelector('header button[aria-label="الإشعارات"]');
        const avatar = document.querySelector('header img[alt="Profile"]');
        return { htmlLen: document.documentElement.outerHTML.length, headlessHeader: !!document.querySelector('header'), bodyStart: (document.body && document.body.innerHTML || '').slice(0, 120) };
      } catch (e) { return { err: String(e) }; }
    })()`,
    returnByValue: true,
  });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

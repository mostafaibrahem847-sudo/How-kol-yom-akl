const http = require('http');
const os = require('os');
const { join, extname } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { readFile } = require('fs/promises');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2' };

const rootDir = process.argv[2] || 'dist-check';
const entry = process.argv[3] || 'index.html';
const kind = process.argv[4] || 'app'; // 'ref' | 'app'

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += entry;
    const data = await readFile(join(process.cwd(), rootDir, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch { res.writeHead(404); res.end('nf'); }
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/${entry}`;
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
  await new Promise((r) => setTimeout(r, kind === 'ref' ? 6000 : 9000));

  const probe = kind === 'ref'
    ? `(() => {
        const rect = (el) => el && ((r) => ({ x: Math.round(r.left), cx: Math.round(r.left + r.width / 2), w: Math.round(r.width), y: Math.round(r.top), h: Math.round(r.height) }))(el.getBoundingClientRect());
        const all = [...document.querySelectorAll('header *')];
        const find = (t) => all.find((e) => (e.textContent || '').trim() === t);
        return {
          dir: document.documentElement.getAttribute('dir') || 'none',
          header: rect(document.querySelector('header')),
          logo: rect(find('soup_kitchen')),
          title: rect(find('هو كل يوم أكل')),
          home: rect(find('Home')),
          bell: rect(document.querySelector('header button[aria-label="الإشعارات"]')),
          avatar: rect(document.querySelector('header img[alt="Profile"]'))
        };
      })()`
    : `(() => {
        const rect = (el) => el && ((r) => ({ x: Math.round(r.left), cx: Math.round(r.left + r.width / 2), w: Math.round(r.width), y: Math.round(r.top), h: Math.round(r.height) }))(el.getBoundingClientRect());
        const all = [...document.querySelectorAll('*')];
        const leaf = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || '').trim()));
        const header = all.find((e) => { const r = e.getBoundingClientRect(); return r.height === 64 && r.top === 0 && r.width >= 360; });
        if (!header) return { err: 'no header' };
        const hLeaves = [...header.querySelectorAll('*')].filter((e) => e.children.length === 0);
        const ff = (e) => (getComputedStyle(e).fontFamily || '').toLowerCase();
        const fs = (e) => parseFloat(getComputedStyle(e).fontSize);
        const logo = hLeaves.find((e) => ff(e).includes('material-community'));
        const bell = hLeaves.find((e) => ff(e).includes('feather') && fs(e) === 24);
        const user = hLeaves.find((e) => ff(e).includes('feather') && fs(e) === 16);
        const title = leaf(/^هو كل يوم أكل$/);
        const home = hLeaves.find((e) => (e.textContent || '').trim() === 'الرئيسية');
        const avatar = user && [...header.querySelectorAll('*')].find((e) => { const r = e.getBoundingClientRect(); return r.width === 32 && r.height === 32 && e.contains(user); });
        return { header: rect(header), logo: rect(logo), title: rect(title), home: rect(home), bell: rect(bell), avatar: rect(avatar) };
      })()`;

  const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
  if (r.exceptionDetails) console.log('EXC ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

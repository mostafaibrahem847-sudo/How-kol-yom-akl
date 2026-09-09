const http = require('http');
const os = require('os');
const { join, extname } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { readFile } = require('fs/promises');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(process.cwd(), 'dist-check', p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch { res.writeHead(404); res.end('nf'); }
});
(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}`;
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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(9000);

  async function js(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('EXC ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  }

  // Detect a 64px full-width bar pinned at the top of the viewport, plus first content position
  const detect = `(() => {
    const all = [...document.querySelectorAll('*')];
    const atTop64 = all.filter((e) => { const x = e.getBoundingClientRect(); return x.height === 64 && x.top === 0 && x.width >= 360 && e.children.length > 0; });
    const topTexts = all.filter((e) => e.children.length === 0 && (e.textContent || '').trim().length > 1 && e.getBoundingClientRect().top > 0);
    const first = topTexts.length ? topTexts[0].getBoundingClientRect() : null;
    const bottomNav = all.find((e) => e.children.length === 0 && /^(الرئيسية|بحث ووصفات|المفضلة|حسابي)$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().top > 650);
    return { pinnedHeaders: atTop64.length, firstContentTop: first ? Math.round(first.top) : null, bottomNavVisible: !!bottomNav };
  })()`;

  const clickTab = (label) => js(`(() => {
    const all = [...document.querySelectorAll('*')];
    const leaf = all.find((e) => e.children.length === 0 && (e.textContent || '').trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().top > 600);
    if (!leaf) return false;
    leaf.click(); return true;
  })()`);

  const out = {};
  out.Home = await js(detect);
  await clickTab('بحث ووصفات'); await sleep(1100); out.Search = await js(detect);
  await clickTab('المفضلة'); await sleep(1100); out.Favorites = await js(detect);
  await clickTab('حسابي'); await sleep(1100); out.Profile = await js(detect);
  console.log(JSON.stringify(out, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

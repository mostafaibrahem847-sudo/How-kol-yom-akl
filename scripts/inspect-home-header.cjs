const http = require('http');
const os = require('os');
const { join } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { readFile } = require('fs/promises');
const { extname } = require('path');

const root = process.argv[2] || 'dist-check';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.map': 'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(process.cwd(), root, p));
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
    const to = setTimeout(() => reject(new Error('timeout ' + buf)), 20000);
    proc.stderr.on('data', (d) => { buf += d.toString(); const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(to); resolve(m[1]); } });
    proc.on('exit', () => reject(new Error('edge exited')));
  });
  const list = await new Promise((res, rej) => http.get({ host: '127.0.0.1', port: new URL(devtoolsUrl).port, path: '/json/list' }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.on('open', r));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 8000));
  const r = await send('Runtime.evaluate', { expression: `(() => {
    const all = [...document.querySelectorAll('*')];
    const leaf = (re) => all.find(e => e.children.length === 0 && re.test((e.textContent||'').trim()));
    const up = (el) => { let n = el; while (n && n.parentElement) { const r = n.getBoundingClientRect(); if (r.width >= 380 && r.height === 64) return n; n = n.parentElement; } return null; };
    const st = (el) => el && getComputedStyle(el);
    const title = leaf(/^هو كل يوم أكل$/);
    const ind = leaf(/^الرئيسية$/);
    const header = up(title);
    const brandRow = title ? (title.parentElement.parentElement) : null;
    const logoBadge = header && [...header.querySelectorAll('*')].find(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.height === 44 && r.width === 44 && s.borderRadius === '22px'; });
    const iconSpans = header ? [...header.querySelectorAll('*')].filter(e => e.children.length === 0) : [];
    const fonts = iconSpans.map(e => st(e).fontFamily || '').filter(f => f);
    const avatar = header && [...header.querySelectorAll('*')].find(e => { const r = e.getBoundingClientRect(); return r.height === 32 && r.width === 32; });
    const bell = header && [...header.querySelectorAll('*')].find(e => (st(e).fontFamily||'').toLowerCase().includes('feather'));
    const ts = st(title), is = st(ind), as = avatar && st(avatar), bs = bell && st(bell);
    return {
      headerFound: !!header,
      titleColor: ts && ts.color, titleSize: ts && ts.fontSize, titleWeight: ts && ts.fontWeight,
      indicatorColor: is && is.color, indicatorSize: is && is.fontSize,
      logoBadge: logoBadge ? (s => ({ bg: getComputedStyle(logoBadge).backgroundColor }))() : null,
      avatarBg: as && as.backgroundColor, avatarRadius: as && as.borderRadius,
      bellColor: bs && bs.color,
      headerBg: header && getComputedStyle(header).backgroundColor,
      brandRowRect: brandRow ? (r => ({ h: r.height }))(brandRow.getBoundingClientRect()) : null
    };
  })()`, returnByValue: true });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

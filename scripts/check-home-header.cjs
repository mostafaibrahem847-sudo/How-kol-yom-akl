const http = require('http');
const os = require('os');
const { readFile } = require('fs/promises');
const { extname, join } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const root = process.argv[2] || 'dist-check';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.map': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(process.cwd(), root, p);
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('nf');
  }
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;

  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edge, ['--headless=new', `--remote-debugging-port=0`, `--user-data-dir=${join(os.tmpdir(), 'pi-preview-' + process.pid)}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });

  // wait for "DevTools listening on ws://..."
  const devtoolsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const to = setTimeout(() => reject(new Error('timeout waiting for devtools: ' + buf)), 20000);
    proc.stderr.on('data', (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(to); resolve(m[1]); }
    });
    proc.on('exit', () => reject(new Error('edge exited')));
  });

  const devtoolsPort = new URL(devtoolsUrl).port;
  const http = require('http');
  const list = await new Promise((res, rej) => http.get({ host: '127.0.0.1', port: devtoolsPort, path: '/json/list' }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.on('open', r));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url });
  await sleep(9000); // let fonts, supabase fetch, images settle

  async function evalJS(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r && r.exceptionDetails) throw new Error('page exception: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r && r.result && r.result.value;
  }

  const geometry = await evalJS(`(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    const txt = (re) => { const el = q('*').find(e => e.children.length === 0 && re.test(e.textContent || '')); return el; };
    const bell = q('[aria-label="الإشعارات"]')[0];
    let header = bell ? bell : null;
    if (header) { while (header && header.parentElement) { const r = header.getBoundingClientRect(); if (r.height >= 50 && r.height <= 90) break; header = header.parentElement; } }
    const greeting = txt(/صباح الفل/);
    const g0 = greeting && greeting.getBoundingClientRect();
    const hr = header && header.getBoundingClientRect();
    return {
      headerTop: hr && hr.top, headerBottom: hr && hr.bottom, headerH: hr && hr.height,
      headerBg: header && getComputedStyle(header).backgroundColor,
      greetingTop: g0 && g0.top, greetingBottom: g0 && g0.bottom,
      greetingText: greeting && (greeting.textContent || '').trim().slice(0, 30),
      gapGreetingBelowHeader: hr && g0 ? g0.top - hr.bottom : null,
      bellFound: !!bell,
      bodyDir: document.body.getAttribute('dir'),
      hasScroll: (() => { const s = document.querySelector('[style*="overflow"]'); return !!s; })()
    };
  })()`);

  console.log('GEOMETRY ' + JSON.stringify(geometry, null, 2));

  // screenshot initial
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  require('fs').writeFileSync('shot-home-top.png', Buffer.from(shot1.data, 'base64'));

  // scroll the RN ScrollView content down and re-measure + screenshot
  const after = await evalJS(`(() => {
    const txt = (re) => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent || ''));
    const scrollables = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 50);
    let scroller = null;
    for (const s of scrollables) { if (s.getBoundingClientRect().height > 300) { scroller = s; break; } }
    if (!scroller) return { err: 'no scroller', n: scrollables.length };
    scroller.scrollTop = 260;
    return { scrolled: true };
  })()`);
  console.log('SCROLL ' + JSON.stringify(after));
  await sleep(700);

  const geometry2 = await evalJS(`(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    const txt = (re) => q('*').find(e => e.children.length === 0 && re.test(e.textContent || ''));
    let header = q('[aria-label="الإشعارات"]')[0];
    if (header) { while (header && header.parentElement) { const r = header.getBoundingClientRect(); if (r.height >= 50 && r.height <= 90) break; header = header.parentElement; } }
    const greeting = txt(/صباح الفل/);
    const hr = header && header.getBoundingClientRect();
    const g0 = greeting && greeting.getBoundingClientRect();
    return {
      headerTopAfterScroll: hr && hr.top, headerBottomAfterScroll: hr && hr.bottom,
      greetingTopAfterScroll: g0 && g0.top,
      greetingUnderHeader: hr && g0 ? (g0.top < hr.bottom) : null
    };
  })()`);
  console.log('GEOMETRY2 ' + JSON.stringify(geometry2, null, 2));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  require('fs').writeFileSync('shot-home-scrolled.png', Buffer.from(shot2.data, 'base64'));

  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

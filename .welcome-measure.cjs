const http = require('http');
const os = require('os');
const { join, extname } = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { readFile } = require('fs/promises');

const root = process.argv[2] || 'dist';
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
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
  const proc = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${join(os.tmpdir(), 'pi-welcome-' + process.pid)}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const devtoolsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const to = setTimeout(() => reject(new Error('timeout ' + buf)), 20000);
    proc.stderr.on('data', (d) => { buf += d.toString(); const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(to); resolve(m[1]); } });
    proc.on('exit', () => reject(new Error('edge exited')));
  });
  const list = await new Promise((res, rej) => http.get({ host: '127.0.0.1', port: new URL(devtoolsUrl).port, path: '/json/list' }, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.on('open', r));
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 7000));

  const expr = `(() => {
    const round = (n) => Math.round(n);
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: round(r.left), y: round(r.top), w: round(r.width), h: round(r.height), bottom: round(r.bottom) }; };
    const all = [...document.querySelectorAll('*')];
    const leaf = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || '').trim()));
    const hero = all.find((e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return parseFloat(s.borderBottomLeftRadius) >= 39 && r.width >= 300 && r.height < 1200 && e.querySelectorAll('*').length > 3;
    });
    const gradients = all
      .map((e) => ({ e, s: getComputedStyle(e), r: e.getBoundingClientRect() }))
      .filter((x) => x.s.backgroundImage && x.s.backgroundImage.includes('linear-gradient'))
      .map((x) => ({ bg: x.s.backgroundImage, rect: { x: round(x.r.left), y: round(x.r.top), w: round(x.r.width), h: round(x.r.height) } }));
    const eyebrow = leaf(/^مطبخك البيتي اليومي$/);
    const lead = leaf(/^أهلاً بيك في$/);
    const desc = leaf(/وصفات بيتي سهلة/);
    const cta = leaf(/^ابدأ دلوقتي$/);
    const login = leaf(/^تسجيل الدخول$/);
    const blessing = leaf(/تسلم إيدك/);
    let card = eyebrow;
    while (card && card.parentElement) {
      const s = getComputedStyle(card);
      if (s.backgroundColor === 'rgb(253, 251, 247)' && parseFloat(s.borderTopLeftRadius) >= 30) break;
      card = card.parentElement;
    }
    const scroll = document.scrollingElement || document.documentElement;
    return {
      viewport: { w: round(window.innerWidth), h: round(window.innerHeight) },
      doc: { scrollH: scroll.scrollHeight, clientH: scroll.clientHeight },
      hero: rect(hero),
      card: rect(card),
      gradients,
      eyebrow: rect(eyebrow),
      lead: rect(lead),
      desc: rect(desc),
      cta: rect(cta),
      login: rect(login),
      blessing: rect(blessing),
    };
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

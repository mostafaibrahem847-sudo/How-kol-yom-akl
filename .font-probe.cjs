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
  const proc = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${join(os.tmpdir(), 'pi-font-' + process.pid)}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
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
    const faces = [...document.styleSheets].flatMap((s) => {
      try { return [...s.cssRules]; } catch { return []; }
    }).filter((r) => r instanceof CSSFontFaceRule)
      .map((r) => ({
        family: r.style.fontFamily,
        weight: r.style.fontWeight || '(unset -> normal/400)',
        style: r.style.fontStyle || '(unset)',
        src: (r.style.src || '').slice(0, 90),
      }));
    const all = [...document.querySelectorAll('*')];
    const leaf = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || '').trim()));
    const info = (name, el) => {
      if (!el) return { name, missing: true };
      const s = getComputedStyle(el);
      return {
        name,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        fontStyle: s.fontStyle,
        fontVariationSettings: s.fontVariationSettings,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      };
    };
    return {
      fontFaces: faces,
      loaded: [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })),
      checks: {
        '400 26px Cairo': document.fonts.check('400 26px "Cairo"'),
        '500 26px Cairo': document.fonts.check('500 26px "Cairo"'),
        '600 26px Cairo': document.fonts.check('600 26px "Cairo"'),
        '700 26px Cairo': document.fonts.check('700 26px "Cairo"'),
        '800 26px Cairo': document.fonts.check('800 26px "Cairo"'),
      },
      els: [
        info('eyebrow', leaf(/^مطبخك البيتي اليومي$/)),
        info('headlineLead', leaf(/^أهلاً بيك في$/)),
        info('brand', leaf(/^هو كل يوم أكل$/)),
        info('desc', leaf(/وصفات بيتي سهلة/)),
        info('cta', leaf(/^ابدأ دلوقتي$/)),
        info('blessing', leaf(/تسلم إيدك/)),
      ],
    };
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

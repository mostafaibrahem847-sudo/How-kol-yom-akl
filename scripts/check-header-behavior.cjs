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
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(9000);

  async function js(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('EXC ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  }

  const stateExpr = (label) => `(() => {
    const all = [...document.querySelectorAll('*')];
    const r = (el) => el && ((x) => ({ top: Math.round(x.top), bottom: Math.round(x.bottom), y: Math.round(x.top), h: Math.round(x.height), w: Math.round(x.width) }))(el.getBoundingClientRect());
    // fixed overlay header = full-width 64px bar pinned at viewport top (outside the scroller)
    const fixed = all.find((e) => { const x = e.getBoundingClientRect(); return x.height === 64 && x.top === 0 && x.width >= 360 && e.children.length > 0; });
    // scrolling header (Profile) = 64px bar that is a child of the scroll content
    const leaves = (el) => [...el.querySelectorAll('*')].filter((e) => e.children.length === 0);
    const ind = (h) => h && leaves(h).find((e) => (e.textContent || '').trim() === ${JSON.stringify(label)} && parseFloat(getComputedStyle(e).fontSize) === 11);
    // main vertical scroller: largest element that can scroll
    let scroller = null;
    for (const s of all) { if (s.scrollHeight > s.clientHeight + 100 && s.getBoundingClientRect().height >= 500) { if (!scroller || s.clientHeight > scroller.clientHeight) scroller = s; } }
    const firstContent = (() => {
      // first text-ish content below the top 64px zone (excludes header leaves)
      const cand = all.filter((e) => e.children.length === 0 && (e.textContent || '').trim().length > 1 && r(e) && r(e).top > 0);
      return cand.length ? r(cand[0]) : null;
    })();
    return { fixedTop: fixed && r(fixed).top, fixedH: fixed && r(fixed).h, fixedIndicator: fixed ? (ind(fixed) ? (ind(fixed).textContent || '').trim() : null) : null, scrollableFound: !!scroller, firstTop: firstContent && firstContent.top };
  })()`;

  const clickTab = (label) => js(`(() => {
    const all = [...document.querySelectorAll('*')];
    const leaf = all.find((e) => e.children.length === 0 && (e.textContent || '').trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().top > 600);
    if (!leaf) return { ok: false, why: 'no leaf for ' + ${JSON.stringify(label)} };
    leaf.click();
    return { ok: true };
  })()`);

  const scrollBy = (dy) => js(`(() => {
    const all = [...document.querySelectorAll('*')];
    let scroller = null;
    for (const s of all) { if (s.scrollHeight > s.clientHeight + 100 && s.getBoundingClientRect().height >= 500) { if (!scroller || s.clientHeight > scroller.clientHeight) scroller = s; } }
    if (!scroller) return { ok: false };
    scroller.scrollTop += ${dy};
    return { ok: true, scrollTop: scroller.scrollTop };
  })()`);

  const results = {};

  // HOME (initial)
  results.Home = await js(stateExpr('الرئيسية'));
  await scrollBy(250); await sleep(400);
  results.HomeScrolled = await js(stateExpr('الرئيسية'));

  // SEARCH
  await clickTab('بحث ووصفات'); await sleep(1200);
  results.Search = await js(stateExpr('بحث ووصفات'));
  await scrollBy(250); await sleep(400);
  results.SearchScrolled = await js(stateExpr('بحث ووصفات'));

  // FAVORITES
  await clickTab('المفضلة'); await sleep(1200);
  results.Favorites = await js(stateExpr('المفضلة'));
  await scrollBy(250); await sleep(400);
  results.FavoritesScrolled = await js(stateExpr('المفضلة'));

  // PROFILE (header must scroll away, not fixed)
  await clickTab('حسابي'); await sleep(1200);
  results.Profile = await js(stateExpr('حسابي'));
  await scrollBy(320); await sleep(400);
  results.ProfileScrolled = await js(stateExpr('حسابي'));

  console.log(JSON.stringify(results, null, 2));
  ws.close(); proc.kill(); server.close(); process.exit(0);
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });

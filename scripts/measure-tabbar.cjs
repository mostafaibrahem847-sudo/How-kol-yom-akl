const { chromium } = require('playwright');
const { createServer } = require('http');
const { readFile } = require('fs/promises');
const { extname, join } = require('path');

const root = process.argv[2] || '/tmp/expoweb-check';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.map': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(root, p);
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('nf');
  }
});

(async () => {
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

const metrics = await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')];
  const leaf = all.find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'الرئيسية');
  if (!leaf) return { error: 'label not found' };
  let bar = leaf;
  while (bar && bar.parentElement) {
    const s = getComputedStyle(bar);
    const r = parseFloat(s.borderTopLeftRadius) || 0;
    if (r > 15) break;
    bar = bar.parentElement;
  }
  const bs = getComputedStyle(bar);
  const barRect = bar.getBoundingClientRect();

  let pillRect = null;
  const walk = (node) => {
    for (const c of node.children) {
      const s = getComputedStyle(c);
      if (c.children.length > 0) walk(c);
      if ((s.backgroundColor || '').trim() === 'rgb(255, 255, 255)' && (parseFloat(s.borderRadius) || 0) > 5 && c.getBoundingClientRect().height < 60 && !pillRect) {
        pillRect = c.getBoundingClientRect();
      }
    }
  };
  walk(bar);

  return {
    viewport: { w: innerWidth, h: innerHeight },
    bar: { x: +barRect.x.toFixed(1), y: +barRect.y.toFixed(1), w: +barRect.width.toFixed(1), h: +barRect.height.toFixed(1), radius: bs.borderTopLeftRadius },
    widthPct: +(100 * barRect.width / innerWidth).toFixed(1),
    bottomGap: +(innerHeight - (barRect.y + barRect.height)).toFixed(1),
    pill: pillRect ? { h: +pillRect.height.toFixed(1), y: +pillRect.y.toFixed(1) } : null,
    leafRect: { y: +(leaf.getBoundingClientRect().y).toFixed(1), h: +(leaf.getBoundingClientRect().height).toFixed(1) },
  };
});
console.log(JSON.stringify(metrics, null, 2));
console.log('pageErrors:', errors.length ? errors : 'none');
await page.screenshot({ path: 'C:/Users/ALArab/AppData/Local/Temp/tabbar-home.png' });
await browser.close();
server.close();
process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * วัด Lighthouse โหมด mobile ทุกหน้าในรอบเดียว รวมหน้าที่ต้องล็อกอิน
 *
 * ปัญหาของการรัน Lighthouse ผ่าน DevTools ทีละหน้าคือช้าและต้องทำซ้ำหลายสิบรอบ
 * ส่วนการรัน Lighthouse CLI ตรง ๆ ใช้กับหน้าที่ต้องล็อกอินไม่ได้ เพราะ token
 * อยู่ใน localStorage และ Lighthouse จะล้าง storage ทิ้งก่อนวัดทุกครั้ง
 *
 * สคริปต์นี้แก้ด้วยการ
 *   1) เปิด Chrome ค้างไว้ตัวเดียว แล้วยัด access_token ลง localStorage
 *   2) เปิด /user หนึ่งรอบให้ AuthContext เขียน cached_user (เลียนแบบผู้ใช้ที่เคยเข้ามาแล้ว)
 *   3) วัดทุก URL บน Chrome ตัวเดิม โดยตั้ง disableStorageReset ไม่ให้ล้าง localStorage
 *   4) ล้าง HTTP cache เองก่อนวัดทุกหน้า
 *
 * ข้อ 4 สำคัญมาก เพราะ disableStorageReset ไม่ได้กันแค่ localStorage แต่กัน
 * การล้าง HTTP cache ด้วย ถ้าไม่ล้างเอง หน้าที่ 2 เป็นต้นไปจะวิ่งบน cache ร้อน
 * (ไฟล์ JS/CSS/ฟอนต์ถูกใช้ซ้ำ) คะแนนจะสูงเกินจริงและไม่ตรงกับที่กดทดสอบใน DevTools
 *
 * วิธีใช้
 *   node scripts/lighthouse-mobile.mjs                        ใช้ค่าจาก config
 *   node scripts/lighthouse-mobile.mjs --base http://localhost:3000
 *   node scripts/lighthouse-mobile.mjs --only "root,user,user/followup"
 *   node scripts/lighthouse-mobile.mjs --desktop              วัดแบบ desktop แทน
 *   node scripts/lighthouse-mobile.mjs --headful              เปิดหน้าต่างจริง ใกล้เคียง DevTools ที่สุด
 *   node scripts/lighthouse-mobile.mjs --runs 3               วัดหน้าละหลายรอบแล้วเอาค่ากลาง
 *
 * token อ่านจาก (เรียงตามลำดับ)
 *   ตัวแปรสภาพแวดล้อม LH_TOKEN  หรือ  ไฟล์ scripts/.lighthouse-auth.json  {"token":"..."}
 * ไม่ใส่ token ก็รันได้ แต่หน้าที่ต้องล็อกอินจะเด้งไป /login
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, '..', '.lighthouse');
const PASS_MARK = 90;

// ── อ่านค่าตั้งต้น ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { desktop: false, headful: false, runs: 1 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--desktop') args.desktop = true;
    else if (argv[i] === '--headful') args.headful = true;
    else if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--only') args.only = argv[++i];
    else if (argv[i] === '--runs') args.runs = Math.max(1, Number(argv[++i]) || 1);
  }
  return args;
}

/**
 * Git Bash แปลงอาร์กิวเมนต์ที่ขึ้นต้นด้วย / ให้เป็นพาธ Windows โดยอัตโนมัติ
 * (--only /user จึงกลายเป็น C:/Program Files/...) จึงรับได้ทั้งแบบมีและไม่มี /
 * นำหน้า เช่น --only "user,user/followup" และใช้คำว่า root แทนหน้าแรก
 */
function normalizePath(raw) {
  const v = raw.trim();
  if (!v || v === 'root' || v === '/') return '/';
  if (/^[A-Za-z]:[\\/]/.test(v) || v.includes('Program Files')) {
    throw new Error(
      `--only "${raw}" ถูกเชลล์แปลงเป็นพาธของเครื่องไปแล้ว ` +
        'ให้เขียนโดยไม่ต้องมี / นำหน้า เช่น --only "root,user,user/followup"'
    );
  }
  return v.startsWith('/') ? v : `/${v}`;
}

function readToken() {
  if (process.env.LH_TOKEN) return process.env.LH_TOKEN.trim();
  const file = path.join(HERE, '.lighthouse-auth.json');
  if (!fs.existsSync(file)) return null;
  try {
    return (JSON.parse(fs.readFileSync(file, 'utf8')).token || '').trim() || null;
  } catch {
    return null;
  }
}

// ── ลงชื่อเข้าใช้ค้างไว้ใน Chrome ที่เปิดอยู่ ─────────────────────────────
async function seedSession(browser, origin, token) {
  const page = await browser.newPage();
  try {
    // ต้องอยู่บน origin เดียวกันก่อนถึงจะเขียน localStorage ของ origin นั้นได้
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.evaluate((t) => localStorage.setItem('access_token', t), token);

    // เปิดหน้า /user หนึ่งรอบ ให้ AuthContext ยิง /auth/me แล้วเขียน cached_user
    // ผลวัดจะได้ตรงกับผู้ใช้จริงที่เคยเข้ามาแล้ว ไม่ใช่การเข้าครั้งแรกสด ๆ
    await page.goto(new URL('/user', origin).href, { waitUntil: 'networkidle2', timeout: 60_000 });
    return await page.evaluate(() => Boolean(localStorage.getItem('cached_user')));
  } finally {
    await page.close();
  }
}

/**
 * ล้างทุกอย่างที่ Lighthouse เคยล้างให้ ยกเว้น localStorage ที่เก็บ token ไว้
 *
 * disableStorageReset ปิดการล้างไปทั้งชุด ไม่ใช่แค่ localStorage จึงต้องล้างเอง
 *   - HTTP cache      ถ้าไม่ล้าง หน้าถัด ๆ ไปวิ่งบน cache ร้อน คะแนนสูงเกินจริง
 *   - service worker  ถ้าไม่ล้าง รอบถัดไปได้ HTML เก่าจาก cache ของ SW มาชนกับ JS
 *                     ใหม่ กลายเป็น hydration mismatch (React error #418) ที่ไม่มีจริง
 *   - CacheStorage    ที่ SW ใช้เก็บไฟล์
 */
async function clearBrowsingState(browser, origin) {
  const page = await browser.newPage();
  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.evaluate(async () => {
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    });
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCache');
    await client.detach();
  } finally {
    await page.close();
  }
}

// ── วัดหนึ่งหน้า ──────────────────────────────────────────────────────────
async function audit(url, port, desktop) {
  const desktopSettings = {
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  };

  const result = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    // หัวใจของสคริปต์ ถ้าไม่ปิด Lighthouse จะล้าง localStorage ทิ้งก่อนวัด
    // แล้วทุกหน้าที่ต้องล็อกอินจะกลายเป็นหน้า /login
    // (HTTP cache ถูกล้างเองด้วย clearHttpCache ก่อนเรียกฟังก์ชันนี้)
    disableStorageReset: true,
    ...(desktop ? desktopSettings : {}),
  });

  return result.lhr;
}

const pct = (c) => (c && c.score !== null ? Math.round(c.score * 100) : null);
const median = (nums) => [...nums].sort((a, b) => a - b)[Math.floor(nums.length / 2)];

/** audit ที่ตกในหมวดที่ยังไม่ถึงเกณฑ์ เรียงตามน้ำหนักมากไปน้อย */
function failingAudits(lhr) {
  const out = [];
  for (const [id, cat] of Object.entries(lhr.categories)) {
    if (pct(cat) >= PASS_MARK) continue;
    const fails = cat.auditRefs
      .filter((r) => r.weight > 0 && lhr.audits[r.id] && lhr.audits[r.id].score !== null && lhr.audits[r.id].score < 1)
      .sort((a, b) => b.weight - a.weight)
      .map((r) => {
        const a = lhr.audits[r.id];
        const val = a.displayValue ? ` ${a.displayValue}` : '';
        return `${r.id}(${Math.round(a.score * 100)}${val})`;
      });
    if (fails.length) out.push(`${id}: ${fails.join('  ')}`);
  }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const config = JSON.parse(fs.readFileSync(path.join(HERE, 'lighthouse-mobile.config.json'), 'utf8'));
const base = args.base || config.baseUrl;
const paths = (args.only ? args.only.split(',') : config.paths).map(normalizePath);
const token = readToken();
const mode = args.desktop ? 'desktop' : 'mobile';

console.log(`\nLighthouse (${mode}${args.headful ? ', หน้าต่างจริง' : ', headless'})  ${base}  ${paths.length} หน้า` +
  (args.runs > 1 ? `  วัดหน้าละ ${args.runs} รอบเอาค่ากลาง` : ''));
console.log(token ? 'ใช้ token ที่ให้มา (วัดหน้าที่ต้องล็อกอินได้)' : '! ไม่มี token — หน้าที่ต้องล็อกอินจะเด้งไป /login');

fs.mkdirSync(OUT_DIR, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromeFlags: [
    ...(args.headful ? [] : ['--headless=new']),
    '--disable-gpu',
    '--no-sandbox',
    // ไม่ให้ส่วนขยายของเบราว์เซอร์มาแย่ง main thread จนตัวเลขเพี้ยน
    // (รายงานที่รันจาก DevTools บนโปรไฟล์ปกติจะมีส่วนขยายปนมาด้วย)
    '--disable-extensions',
  ],
});
const browserURL = `http://127.0.0.1:${chrome.port}`;
const browser = await puppeteer.connect({ browserURL, defaultViewport: null });

const rows = [];
try {
  if (token) {
    const seeded = await seedSession(browser, base, token);
    console.log(seeded ? 'ลงชื่อเข้าใช้สำเร็จ\n' : '! ยัด token แล้วแต่ไม่พบ cached_user — token อาจหมดอายุ\n');
  } else {
    console.log('');
  }

  for (const p of paths) {
    const url = new URL(p, base).href;
    process.stdout.write(`  ${p} ... `);
    try {
      const results = [];
      for (let i = 0; i < args.runs; i++) {
        await clearBrowsingState(browser, base);
        results.push(await audit(url, chrome.port, args.desktop));
      }
      // เรียงตามคะแนน performance แล้วหยิบตัวกลาง ลดผลของรอบที่แกว่งผิดปกติ
      results.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
      const lhr = results[Math.floor(results.length / 2)];

      const row = {
        path: p,
        perf: pct(lhr.categories.performance),
        a11y: pct(lhr.categories.accessibility),
        bp: pct(lhr.categories['best-practices']),
        seo: pct(lhr.categories.seo),
        spread: args.runs > 1 ? results.map((r) => pct(r.categories.performance)) : null,
        fails: failingAudits(lhr),
      };
      rows.push(row);
      // แทนอักขระที่ใช้ในชื่อไฟล์ Windows ไม่ได้ (รวม ? = & ของ query string)
      const name = p.replace(/[/:?=&*"<>|]/g, '_') || '_root';
      fs.writeFileSync(path.join(OUT_DIR, `${mode}${name}.json`), JSON.stringify(lhr));
      console.log(
        [row.perf, row.a11y, row.bp, row.seo].join(' / ') +
          (row.spread ? `   (perf ทุกรอบ ${row.spread.join(', ')})` : '')
      );
    } catch (err) {
      rows.push({ path: p, error: err.message });
      console.log(`ผิดพลาด: ${err.message}`);
    }
  }
} finally {
  browser.disconnect();
  await chrome.kill();
}

// ── สรุป ──────────────────────────────────────────────────────────────────
const w = Math.max(...rows.map((r) => r.path.length), 4);
console.log(`\n${'หน้า'.padEnd(w)}  perf  a11y    bp   seo`);
console.log('-'.repeat(w + 26));
const cell = (v) => (v === undefined || v === null ? '    -' : String(v).padStart(4) + (v < PASS_MARK ? '*' : ' '));
for (const r of rows) {
  if (r.error) {
    console.log(`${r.path.padEnd(w)}  ${r.error}`);
    continue;
  }
  console.log(`${r.path.padEnd(w)} ${cell(r.perf)}${cell(r.a11y)}${cell(r.bp)}${cell(r.seo)}`);
}

const measured = rows.filter((r) => !r.error);
const failed = measured.filter((r) => [r.perf, r.a11y, r.bp, r.seo].some((v) => v < PASS_MARK));
console.log(`\n${measured.length - failed.length}/${measured.length} หน้าผ่านเกณฑ์ ${PASS_MARK} ครบทุกหมวด`);

if (failed.length) {
  console.log('\nรายละเอียดหน้าที่ยังไม่ผ่าน');
  for (const r of failed) {
    console.log(`\n  ${r.path}`);
    for (const line of r.fails) console.log(`    ${line}`);
  }
}
console.log(`\nรายงานฉบับเต็มอยู่ใน ${path.relative(process.cwd(), OUT_DIR)}\n`);
process.exit(failed.length ? 1 : 0);

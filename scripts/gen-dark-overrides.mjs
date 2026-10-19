/**
 * สร้าง app/styles/dark-overrides.css — สีโหมดมืดของคลาสสีที่หน้าฝั่งผู้ใช้ใช้อยู่ (วิธี A)
 *
 * หน้าเดิมเขียนสีตรง ๆ เช่น bg-green-50, text-blue-800 ซึ่งตั้งใจไว้สำหรับพื้นขาว
 * พอพื้นเป็นสีมืด พื้นอ่อน ๆ จะสว่างจ้า และตัวหนังสือสีเข้มจะอ่านไม่ออก
 * สคริปต์นี้ไล่หาคลาสสีที่ใช้จริงในไฟล์ฝั่งผู้ใช้ แล้วสร้างกฎสำหรับโหมดมืดให้
 *   - พื้นอ่อน (50–200) → สีเดียวกันแบบโปร่งบนพื้นมืด
 *   - ขอบอ่อน (50–300) → สีเดียวกันแบบโปร่ง
 *   - ตัวหนังสือเข้ม (600–950) → เฉดอ่อนของสีเดียวกัน
 * สีเทาไม่ต้องสร้างตรงนี้ เพราะสลับค่าตัวแปรใน globals.css ทั้งชุดแล้ว
 *
 * รันใหม่ทุกครั้งที่เพิ่มคลาสสีในหน้าฝั่งผู้ใช้:  node scripts/gen-dark-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');

// ไฟล์ที่ไม่ใช่ฝั่งผู้ใช้ หรือเป็นหน้าสำหรับนักพัฒนา
const SKIP = [/[\\/]admin/, /examcat/, /debug/, /Navbar_admin/, /TiptapEditor/];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') && !SKIP.some((r) => r.test(p))) out.push(p);
  }
  return out;
}

const files = [...walk(path.join(root, 'app', 'user')), ...walk(path.join(root, 'components'))];

const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const VARIANTS = 'hover|focus|group-hover|active|focus-within';
const re = new RegExp(
  `(?<![\\w:/-])(?:(${VARIANTS}):)?(bg|text|border|from|via|to|ring)-(${HUES})-(\\d+)(?:/(\\d+))?(?![\\w/-])`,
  'g',
);

const found = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(re)) found.set(m[0], m.slice(1));
}

const esc = (cls) => cls.replace(/[:/.]/g, (c) => `\\${c}`);

/** ความทึบของพื้นสีบนพื้นมืด ตามเฉดเดิม */
const BG_ALPHA = { 50: 12, 100: 16, 200: 24, 300: 34 };
/** ตัวหนังสือเข้มกลายเป็นเฉดอ่อน */
const TEXT_SHADE = { 600: 400, 700: 300, 800: 200, 900: 100, 950: 100 };

function declaration(prop, hue, shade, opacity) {
  const op = opacity ? Number(opacity) / 100 : 1;
  const tint = (a) => `color-mix(in oklab, var(--color-${hue}-500) ${Math.round(a * op)}%, transparent)`;
  switch (prop) {
    case 'bg':
      return BG_ALPHA[shade] ? `background-color: ${tint(BG_ALPHA[shade])};` : null;
    case 'border':
      return shade <= 300 ? `border-color: ${tint(38)};` : null;
    case 'ring':
      return shade <= 200 ? `--tw-ring-color: ${tint(30)};` : null;
    case 'from':
    case 'via':
    case 'to':
      return BG_ALPHA[shade] ? `--tw-gradient-${prop}: ${tint(BG_ALPHA[shade])};` : null;
    case 'text':
      return TEXT_SHADE[shade] ? `color: var(--color-${hue}-${TEXT_SHADE[shade]});` : null;
  }
  return null;
}

function selector(cls, variant) {
  const base = `.${esc(cls)}`;
  switch (variant) {
    case 'hover':
      return `${base}:hover`;
    case 'focus':
      return `${base}:focus`;
    case 'active':
      return `${base}:active`;
    case 'focus-within':
      return `${base}:focus-within`;
    case 'group-hover':
      return `.group:hover ${base}`;
    default:
      return base;
  }
}

const plain = [];
const hover = [];
for (const [cls, [variant, prop, hue, shadeStr, opacity]] of [...found].sort(([a], [b]) => a.localeCompare(b))) {
  const decl = declaration(prop, hue, Number(shadeStr), opacity);
  if (!decl) continue;
  // :where(.dark) ไม่เพิ่มความเจาะจง กฎจึงเท่ากับคลาสเดิมแต่มาทีหลังเลยชนะ
  // ขณะที่ hover:/dark: ของ Tailwind ยังเจาะจงกว่าและทำงานได้ตามปกติ
  const rule = `  :where(.dark) ${selector(cls, variant)} { ${decl} }`;
  (variant === 'hover' || variant === 'group-hover' ? hover : plain).push(rule);
}

const out = `/* ไฟล์นี้สร้างอัตโนมัติด้วย scripts/gen-dark-overrides.mjs — อย่าแก้ด้วยมือ */
/* สีโหมดมืดของคลาสสีที่หน้าฝั่งผู้ใช้ใช้อยู่ (${plain.length + hover.length} กฎ) */
@layer utilities {
${plain.join('\n')}
  @media (hover: hover) {
${hover.map((r) => '  ' + r).join('\n')}
  }
}
`;

const target = path.join(root, 'app', 'styles', 'dark-overrides.css');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log(`เขียน ${path.relative(root, target)} แล้ว ${plain.length + hover.length} กฎ จาก ${files.length} ไฟล์`);

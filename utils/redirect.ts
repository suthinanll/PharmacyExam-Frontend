/**
 * อ่านปลายทางที่ค้างไว้จาก query string (?redirect=...) แบบปลอดภัย
 *
 * รับเฉพาะ path ภายในเว็บเท่านั้น (ขึ้นต้นด้วย / ตัวเดียว) เพื่อกัน open redirect —
 * ถ้าปล่อยให้ใส่ URL เต็มได้ จะถูกหลอกเป็น /login?redirect=https://evil.com
 * แล้วพาผู้ใช้ที่เพิ่งล็อกอินไปเว็บปลอมได้
 */
export function getSafeRedirect(search?: string): string | null {
  const query = search ?? (typeof window !== "undefined" ? window.location.search : "");
  if (!query) return null;

  const raw = new URLSearchParams(query).get("redirect");
  if (!raw) return null;

  // ต้องเป็น path ภายในเว็บ: ขึ้นต้นด้วย / แต่ไม่ใช่ // (protocol-relative URL) และไม่มี :
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null;
  }
  return raw;
}

/** ต่อ ?redirect= เข้ากับปลายทาง เช่น withRedirect("/login", "/upgrade-admin") */
export function withRedirect(target: string, redirectTo: string): string {
  return `${target}?redirect=${encodeURIComponent(redirectTo)}`;
}

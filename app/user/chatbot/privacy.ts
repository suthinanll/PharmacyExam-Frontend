// ใช้ชื่อเดียวกับคีย์ localStorage เดิม ทั้งเซิร์ฟเวอร์ (page.tsx) และไคลเอนต์ใช้ร่วมกัน
export const PRIVACY_COOKIE = 'chatbot_privacy_accepted';

/** จำไว้ทั้งคุกกี้ (ให้เซิร์ฟเวอร์รู้ตอนวาด HTML) และ localStorage (ค่าเดิมที่ใช้มาก่อน) */
export function rememberPrivacyAccepted() {
  localStorage.setItem(PRIVACY_COOKIE, 'true');
  document.cookie = `${PRIVACY_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`;
}

// ใช้ชื่อเดียวกับคีย์ localStorage เดิม ทั้งเซิร์ฟเวอร์และไคลเอนต์ใช้ร่วมกัน
export const PRIVACY_COOKIE = 'chatbot_privacy_accepted';

/** จำไว้ทั้งคุกกี้ และ localStorage */
export function rememberPrivacyAccepted() {
  localStorage.setItem(PRIVACY_COOKIE, 'true');
  document.cookie = `${PRIVACY_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`;
}

export function hasAcceptedPrivacy(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PRIVACY_COOKIE) === 'true';
}

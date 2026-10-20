import { redirect } from 'next/navigation';

/** แชตบอตย้ายเป็น floating widget บนหน้าหลักแล้ว */
export default function ChatbotRedirectPage() {
  redirect('/user');
}

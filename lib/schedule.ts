// ตรรกะเลือก "กำหนดการที่ต้องนับถอยหลัง" แยกออกมาเป็นฟังก์ชันบริสุทธิ์
// เพื่อให้เรียกได้ทั้งฝั่งเซิร์ฟเวอร์ (ตอน render หน้าแรก) และฝั่งไคลเอนต์ (ตอนรีเฟรชข้อมูล)
// เดิมตรรกะนี้ฝังอยู่ใน useEffect ทำให้หัวข้อการ์ดนับถอยหลังต้องรอ fetch จบก่อนถึงจะวาด
// ซึ่งทำให้ LCP ช้าไปกว่า 3 วินาที

export interface ScheduleItem {
  id: number;
  title: string;
  description?: string;
  link_url?: string;
  targetStamp: number;
  endStamp: number;
  [key: string]: unknown;
}

export interface DerivedSchedule {
  targetDate: number | null;
  targetTitle: string;
  targetDesc: string;
  targetLink: string;
  todayExams: ScheduleItem[];
  upcomingExams: ScheduleItem[];
}

export const EMPTY_SCHEDULE: DerivedSchedule = {
  targetDate: null,
  targetTitle: "",
  targetDesc: "",
  targetLink: "",
  todayExams: [],
  upcomingExams: [],
};

/** แปลงข้อมูลดิบจาก /schedules เป็นรายการที่เผยแพร่แล้ว เรียงตามวันเริ่ม */
export function normalizeSchedules(raw: unknown): ScheduleItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item: any) => item.is_public === true || item.is_public === 1)
    .map((item: any) => {
      const startObj = new Date(item.start_time);
      startObj.setHours(0, 0, 0, 0);

      const endObj = item.end_time
        ? new Date(item.end_time)
        : new Date(item.start_time);
      endObj.setHours(23, 59, 59, 999);

      return {
        ...item,
        targetStamp: startObj.getTime(),
        endStamp: endObj.getTime(),
      } as ScheduleItem;
    })
    .sort((a, b) => a.targetStamp - b.targetStamp);
}

/**
 * เลือกกำหนดการเป้าหมายตามลำดับความสำคัญ
 * 1) กำหนดการที่กำลังดำเนินอยู่ (now อยู่ระหว่าง start-end) → นับถอยหลังไปวันสิ้นสุด
 * 2) กำหนดการของวันนี้
 * 3) กำหนดการถัดไปในอนาคต (รวมทุกรายการที่อยู่วันเดียวกัน)
 */
export function deriveSchedule(raw: unknown, now: number): DerivedSchedule {
  const allExams = normalizeSchedules(raw);
  if (allExams.length === 0) return EMPTY_SCHEDULE;

  const todayStr = new Date(now).toDateString();
  const sameDayAs = (stamp: number) => new Date(stamp).toDateString();

  const ongoingExam = allExams.find(
    (exam) => now >= exam.targetStamp && now <= exam.endStamp,
  );

  if (ongoingExam) {
    return {
      targetDate: ongoingExam.endStamp,
      targetTitle: ongoingExam.title,
      targetDesc: ongoingExam.description || "กำหนดการนี้กำลังดำเนินการอยู่",
      targetLink: ongoingExam.link_url || "",
      todayExams: [ongoingExam],
      upcomingExams: allExams
        .filter((e) => e.targetStamp > now)
        .slice(0, 4),
    };
  }

  const examToday = allExams.find((exam) => sameDayAs(exam.targetStamp) === todayStr);

  if (examToday) {
    return {
      targetDate: examToday.targetStamp,
      targetTitle: examToday.title,
      targetDesc: examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้",
      targetLink: examToday.link_url || "",
      todayExams: allExams.filter((e) => sameDayAs(e.targetStamp) === todayStr),
      upcomingExams: allExams
        .filter((e) => sameDayAs(e.targetStamp) !== todayStr && e.targetStamp > now)
        .slice(0, 4),
    };
  }

  const futureExams = allExams.filter((exam) => exam.targetStamp > now);
  if (futureExams.length === 0) return EMPTY_SCHEDULE;

  const firstExam = futureExams[0];
  const firstExamDateStr = sameDayAs(firstExam.targetStamp);

  return {
    targetDate: firstExam.targetStamp,
    targetTitle: firstExam.title,
    targetDesc:
      firstExam.description || "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง",
    targetLink: firstExam.link_url || "",
    // เก็บทุกรายการที่อยู่วันเดียวกับกำหนดการแรก
    todayExams: futureExams.filter((e) => sameDayAs(e.targetStamp) === firstExamDateStr),
    upcomingExams: futureExams
      .filter((e) => sameDayAs(e.targetStamp) !== firstExamDateStr)
      .slice(0, 4),
  };
}

/** ดึงตารางสอบสาธารณะฝั่งเซิร์ฟเวอร์ คืน null เมื่อดึงไม่สำเร็จเพื่อให้ไคลเอนต์ดึงเองแทน */
export async function fetchPublicSchedules(): Promise<unknown | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/schedules`, {
      // GET /schedules เป็น @Public() จึงแคชได้ ลดภาระ backend เมื่อมีผู้ใช้พร้อมกันหลายคน
      next: { revalidate: 60 },
      // กัน backend ช้าไม่ให้ลาก TTFB ของหน้าไปด้วย — เกินเวลาแล้วปล่อยให้ไคลเอนต์ดึงเอง
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

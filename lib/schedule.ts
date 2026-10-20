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

/**
 * เอาเครื่องหมาย [ ] ที่ผู้ดูแลใช้ครอบชื่อประเภทการสอบออก (เก็บข้อความข้างในไว้)
 * เช่น "การสอบครั้งที่ 5/2569 [การสอบสมรรถนะเฉพาะสาขา]" -> "การสอบครั้งที่ 5/2569 การสอบสมรรถนะเฉพาะสาขา"
 * แก้ตอนแสดงผลในหน้าแรก ข้อมูลใน backend ไม่เปลี่ยน
 */
function stripBrackets(text: unknown): string {
  return String(text ?? "").replace(/[[\]]/g, "").replace(/[ \t]{2,}/g, " ").trim();
}

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
        title: stripBrackets(item.title),
        description: item.description ? stripBrackets(item.description) : item.description,
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
export function deriveSchedule(
  raw: unknown,
  now: number,
  track: TrackFilter = "all",
): DerivedSchedule {
  const allExams = normalizeSchedules(raw).filter((exam) =>
    matchesTrack(exam.type_event as TypeEvent, track),
  );
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

// ─── สายการสอบ PLE ───────────────────────────────────────
// type_event ของแอดมินเขียนเป็นรหัส PLE เช่น "PLE-CC1", "PLE-IP2" หรือรวมกันใน string เดียว
// "PLE-IP1, PC1, PHCP1" — CC คือส่วนกลางที่ทุกคนต้องสอบ ส่วน IP / PC / PHCP แยกตามสาย
export type ExamTrack = "CC" | "IP" | "PC" | "PHCP";
export type TrackFilter = ExamTrack | "all";
/** type_event มาจาก API เป็น array แต่บางที่ได้เป็น string รูปแบบ postgres "{a,b}" */
type TypeEvent = string[] | string | null | undefined;

export const TRACK_FILTERS: { value: TrackFilter; label: string; hint: string }[] = [
  { value: "all", label: "ทุกสาย", hint: "แสดงกำหนดการทั้งหมด" },
  { value: "CC", label: "CC", hint: "ส่วนกลาง (ทุกคนต้องสอบ)" },
  { value: "IP", label: "IP", hint: "สายอุตสาหการ + CC" },
  { value: "PC", label: "PC", hint: "สายบริบาล + CC" },
  { value: "PHCP", label: "PHCP", hint: "สายคุ้มครองผู้บริโภค + CC" },
];

/** สายที่ผู้ใช้เลือกจำไว้ในเครื่อง ใช้ร่วมกันระหว่างหน้าแรกและหน้าปฏิทิน */
const TRACK_FILTER_KEY = "calendar-track-filter";

export function readSavedTrack(): TrackFilter {
  try {
    const saved = localStorage.getItem(TRACK_FILTER_KEY);
    if (saved && TRACK_FILTERS.some((t) => t.value === saved)) return saved as TrackFilter;
  } catch {}
  return "all";
}

export function saveTrack(value: TrackFilter) {
  try {
    localStorage.setItem(TRACK_FILTER_KEY, value);
  } catch {}
}

/** ดึงสายการสอบจาก type_event — ถ้าไม่มีรหัส PLE เลยคืน set ว่าง (ถือเป็นกำหนดการทั่วไป) */
export function scheduleTracks(typeEvent: TypeEvent): Set<ExamTrack> {
  const tracks = new Set<ExamTrack>();
  const list = Array.isArray(typeEvent) ? typeEvent : typeEvent ? [typeEvent] : [];
  for (const t of list) {
    for (const m of t.toUpperCase().matchAll(/\b(PHCP|CC|IP|PC)\d*\b/g)) {
      tracks.add(m[1] as ExamTrack);
    }
  }
  return tracks;
}

/**
 * กรองตามสายที่เลือก: "all" แสดงทั้งหมด, "CC" แสดงเฉพาะส่วนกลาง,
 * สายอื่นแสดงส่วนกลางด้วยเพราะทุกคนต้องสอบ CC — กำหนดการทั่วไปที่ไม่มีรหัส PLE แสดงเสมอ
 */
export function matchesTrack(typeEvent: TypeEvent, filter: TrackFilter): boolean {
  if (filter === "all") return true;
  const tracks = scheduleTracks(typeEvent);
  if (tracks.size === 0) return true;
  return tracks.has(filter) || tracks.has("CC");
}

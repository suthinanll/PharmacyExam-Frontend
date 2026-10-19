/**
 * ชนิดข้อมูลของแบบประเมินความพึงพอใจ — ตรงกับ pharmacy_backend/src/survey/survey.definition.ts
 * หน้าเว็บไม่ได้เก็บคำถามเอง ดึงจาก GET /survey ทุกครั้ง แก้คำถามที่ backend ที่เดียว
 */

export type SurveyOption = { value: string; label: string };

export type ChoiceQuestion = {
  id: string;
  label: string;
  type: 'single' | 'multi';
  required: boolean;
  options: SurveyOption[];
  otherValue?: string;
  showIf?: { questionId: string; value: string };
};

export type LikertGroup = {
  id: string;
  title: string;
  description: string;
  page: 1 | 2;
  items: { id: string; text: string }[];
};

export type RankingGroup = {
  id: string;
  title: string;
  description: string;
  /** image = ภาพหน้าจอของฟังก์ชัน (public/survey/*.jpg) */
  items: { id: string; label: string; image?: string }[];
};

export type SurveyDefinition = {
  version: number;
  title: string;
  consent: {
    title: string;
    before: string[];
    activities: string[];
    after: string[];
    pdpaNotice: string;
    question: string;
  };
  demographics: ChoiceQuestion[];
  likertScale: { min: number; max: number; labels: string[] };
  likertGroups: LikertGroup[];
  rankingGroups: RankingGroup[];
  suggestion: { label: string; maxLength: number };
};

export type SurveyAnswers = {
  consent: boolean;
  demographics: Record<string, string | string[]>;
  likert: Record<string, number>;
  ranking: Record<string, Record<string, number>>;
  suggestion: string;
};

export const emptyAnswers = (): SurveyAnswers => ({
  consent: false,
  demographics: {},
  likert: {},
  ranking: {},
  suggestion: '',
});

/** คำถามข้อนี้ต้องแสดงไหม (เช่น ข้อ 6 แสดงเมื่อข้อ 5 ตอบ "เคย") */
export function isQuestionVisible(q: ChoiceQuestion, demographics: SurveyAnswers['demographics']) {
  return !q.showIf || demographics[q.showIf.questionId] === q.showIf.value;
}

/** สีของระดับความคิดเห็น ใช้ในแดชบอร์ดแอดมิน */
export const LEVEL_STYLE: Record<string, string> = {
  มากที่สุด: 'bg-green-100 text-green-800',
  มาก: 'bg-lime-100 text-lime-800',
  ปานกลาง: 'bg-yellow-100 text-yellow-800',
  น้อย: 'bg-orange-100 text-orange-800',
  น้อยที่สุด: 'bg-red-100 text-red-800',
};

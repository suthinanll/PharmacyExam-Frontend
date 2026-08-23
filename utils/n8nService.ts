/**
 * n8n AI Analysis Service
 * เชื่อมต่อกับ n8n Webhook เพื่อวิเคราะห์ผลการสอบด้วย AI (Groq + AI Agent)
 */

export interface AIAnalysisResult {
  summary?: string;
  analysis_summary?: string;
  overall_feedback?: string;
  weak_topics_advice?: Array<{
    topic: string;
    subject?: string;
    issue?: string;
    why_challenging?: string;
    recommendation?: string;
    clinical_pearl?: string;
    study_tip?: string;
    recommended_resource?: string;
    link?: string;
    reference_url?: string;
    priority?: string;
  }>;
  weak_topics_analysis?: Array<any>;
  analysis_points?: Array<any>;
  memory_techniques?: Array<{
    topic?: string;
    mnemonic_name?: string;
    mnemonic_detail?: string;
  }>;
  action_plan?: any;
  study_plan?: any;
  recommendations?: string[];
  trend_summary?: string;
  key_insights?: Array<{
    title?: string;
    description?: string;
    severity?: "high" | "medium" | "low";
  }>;
  output?: string;
  text?: string;
}

const API_ENDPOINT = "/api/n8n/analysis";

/**
 * เรียก n8n Webhook สำหรับวิเคราะห์ผลสอบของผู้เรียนรายบุคคล (User Followup)
 */
export async function requestUserAIAnalysis(
  userId: number,
  contextData?: {
    stats?: any;
    radar_data?: any[];
    weak_topics?: any[];
  }
): Promise<AIAnalysisResult> {
  const payload = {
    type: "user",
    requestType: "user",
    userId,
    timestamp: new Date().toISOString(),
    stats: contextData?.stats,
    radar_data: contextData?.radar_data,
    weak_topics: contextData?.weak_topics,
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawData = await response.json();

  if (!response.ok) {
    const errorMsg =
      rawData?.details || rawData?.message || rawData?.error || `HTTP ${response.status}`;
    throw new Error(`AI Analysis Error: ${errorMsg}`);
  }

  return normalizeAIResponse(rawData);
}

/**
 * เรียก n8n Webhook สำหรับวิเคราะห์แนวโน้มภาพรวมของผู้สอบทั้งหมด (Admin Dashboard)
 */
export async function requestAdminAIAnalysis(
  contextData?: {
    stats?: any;
    monthly_scores?: any[];
  }
): Promise<AIAnalysisResult> {
  const payload = {
    type: "admin",
    requestType: "admin",
    timestamp: new Date().toISOString(),
    stats: contextData?.stats,
    monthly_scores: contextData?.monthly_scores,
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawData = await response.json();

  if (!response.ok) {
    const errorMsg =
      rawData?.details || rawData?.message || rawData?.error || `HTTP ${response.status}`;
    throw new Error(`AI Analysis Error: ${errorMsg}`);
  }

  return normalizeAIResponse(rawData);
}

/**
 * แปลงผลลัพธ์จาก n8n ให้เป็นโครงสร้างที่เข้ากันได้เสมอ
 */
function normalizeAIResponse(data: any): AIAnalysisResult {
  if (!data) return {};

  let item = Array.isArray(data) ? data[0] : data;

  if (typeof item === "string") {
    try {
      item = JSON.parse(item);
    } catch {
      return { output: item, summary: item };
    }
  }

  if (item && typeof item === "object") {
    // Unpack if output is an object
    if (item.output && typeof item.output === "object") {
      item = { ...item, ...item.output };
    } else if (typeof item.output === "string") {
      try {
        const parsed = JSON.parse(item.output);
        if (parsed && typeof parsed === "object") {
          item = { ...item, ...parsed };
        }
      } catch {
        // output is a plain string
      }
    }

    if (item.response && typeof item.response === "object") {
      item = { ...item, ...item.response };
    }
    if (item.data && typeof item.data === "object") {
      item = { ...item, ...item.data };
    }
    if (item.json && typeof item.json === "object") {
      item = { ...item, ...item.json };
    }
  }

  // Normalize summary alias
  const summary =
    item.summary ||
    item.analysis_summary ||
    item.overall_feedback ||
    item.overview ||
    item.evaluation_summary;

  // Normalize weak topics advice alias
  const rawWeak =
    item.weak_topics_advice ||
    item.weak_topics_analysis ||
    item.analysis_points ||
    item.weak_topics ||
    item.weaknesses ||
    [];

  const normalizedWeak = Array.isArray(rawWeak)
    ? rawWeak.map((wt: any) => {
        if (typeof wt === "string") return { topic: wt, issue: "", recommendation: wt };
        return {
          ...wt,
          topic: wt.topic || wt.title || wt.name || wt.subject || "หัวข้อที่ควรทบทวน",
          subject: wt.subject || "",
          issue: wt.issue || wt.why_challenging || wt.problem || wt.mistake || wt.weakness || "",
          why_challenging: wt.why_challenging || wt.issue || "",
          recommendation: wt.recommendation || wt.clinical_pearl || wt.study_tip || wt.solution || wt.advice || "",
          clinical_pearl: wt.clinical_pearl || wt.recommendation || "",
          link: wt.link || wt.recommended_resource || wt.reference_url || wt.references || "",
          recommended_resource: wt.recommended_resource || wt.link || "",
        };
      })
    : [];

  // Normalize action plan
  const actionPlan =
    item.action_plan ||
    item.study_plan ||
    item.learning_plan ||
    item.schedule;

  return {
    ...item,
    summary: typeof summary === "string" ? summary : summary ? JSON.stringify(summary) : undefined,
    analysis_summary: typeof summary === "string" ? summary : undefined,
    weak_topics_advice: normalizedWeak,
    weak_topics_analysis: normalizedWeak,
    action_plan: actionPlan || item.action_plan,
    output: typeof item.output === "string" ? item.output : undefined,
  };
}


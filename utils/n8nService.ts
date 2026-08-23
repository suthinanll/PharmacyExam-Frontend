/**
 * n8n AI Analysis Service
 * เชื่อมต่อกับ n8n Webhook เพื่อวิเคราะห์ผลการสอบด้วย AI (Groq + AI Agent)
 */

export interface AIAnalysisResult {
  summary?: string;
  overall_feedback?: string;
  weak_topics_advice?: Array<{
    topic: string;
    issue?: string;
    recommendation?: string;
    study_tip?: string;
    priority?: string;
  }>;
  analysis_points?: Array<{
    title?: string;
    topic?: string;
    issue?: string;
    recommendation?: string;
    priority?: string;
  }>;
  action_plan?: string | string[];
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

  // Ensure output field is never an object in JSX
  if (item.output && typeof item.output === "object") {
    item.output = JSON.stringify(item.output, null, 2);
  }

  return item;
}

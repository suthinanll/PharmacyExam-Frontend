export interface AnswerOption {
  option_id: number;
  option_text: string;
  is_correct?: boolean;
  option_image_url?: string;
}

export interface Situation {
  situation_id: number;
  situation_title?: string;
  situation_text: string;
  situation_image_url?: string;
}

export interface MSTItem {
  item_id: number;
  question_text: string;
  question_type?: string;
  explanation?: string;
  question_image_url?: string;
  situation?: Situation | null;
  answer_options: AnswerOption[];
  sub_topics?: Array<{ sub_topic_id: number; sub_topic_name: string }>;
}

export interface MSTCurrentStageData {
  session_id: number;
  current_stage: number;
  total_stages: number;
  items_per_stage: number;
  current_theta: number;
  current_se: number;
  routing_path: string[];
  stage_items: MSTItem[];
}

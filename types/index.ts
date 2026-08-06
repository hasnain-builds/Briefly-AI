export interface GeminiSummaryResponse {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
}

export interface SummaryRecord {
  id: string;
  user_id: string;
  original_text: string;
  summary: string;
  key_points: string[];
  keywords: string[];
  reading_time_saved: number;
  favorite: boolean;
  created_at: string;
  source_type?: string;
  source_url?: string;
  page_title?: string;
  title?: string;
}

export interface UserProfile {
  id: string;
  plan: "free" | "pro";
  plan_expires_at?: string | null;
  text_usage: number;
  pdf_usage: number;
  url_usage: number;
  text_limit: number | null;
  pdf_limit: number | null;
  url_limit: number | null;
  usage_reset_at: string;
  feedback_completed?: boolean;
  feedback_remind_after?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UsageInfo {
  plan: "free" | "pro";
  textUsage: number;
  textLimit: number | null;
  pdfUsage: number;
  pdfLimit: number | null;
  urlUsage: number;
  urlLimit: number | null;
  usageResetAt: string;
  monthlyUsage: number;
  monthlyLimit: number | null;
  remaining: number | null;
  feedbackCompleted?: boolean;
  feedbackRemindAfter?: number;
}

export interface UserConsent {
  id?: string;
  user_id?: string;
  consent_version: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  accepted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackRecord {
  id?: string;
  user_id?: string;
  rating: number;
  feedback?: string;
  app_version?: string;
  created_at?: string;
}

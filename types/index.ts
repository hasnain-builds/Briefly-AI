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
  is_favorite: boolean;
  created_at: string;
}

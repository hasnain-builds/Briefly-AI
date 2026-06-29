import { createClient } from "@/lib/supabase/server";
import { SummaryRecord } from "@/types";

export async function saveSummary(params: {
  originalText: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to save summaries.");
  }

  // Extract only the numeric value (e.g. "2 minutes" -> 2)
  const match = params.readingTimeSaved.match(/\d+/);
  const numericTimeSaved = match ? parseInt(match[0], 10) : 0;

  const { data, error } = await supabase
    .from("summaries")
    .insert({
      user_id: user.id,
      original_text: params.originalText,
      summary: params.summary,
      key_points: params.keyPoints,
      keywords: params.keywords,
      reading_time_saved: numericTimeSaved,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data as SummaryRecord;
}

export async function getRecentSummaries(): Promise<SummaryRecord[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to view summaries.");
  }

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data as SummaryRecord[];
}

export async function deleteSummary(id: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to delete summaries.");
  }

  const { error } = await supabase
    .from("summaries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

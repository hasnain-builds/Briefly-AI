import { createClient } from "@/lib/supabase/server";
import { SummaryRecord } from "@/types";

export async function saveSummary(params: {
  originalText: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
  sourceType?: string;
  sourceUrl?: string;
  pageTitle?: string;
  title?: string;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to save summaries.");
  }

  // Extract only the numeric value (e.g. "2 minutes" -> 2)
  const match = params.readingTimeSaved.match(/\d+/);
  const numericTimeSaved = match ? parseInt(match[0], 10) : 0;

  const insertPayload = {
    user_id: user.id,
    original_text: params.originalText,
    summary: params.summary,
    key_points: params.keyPoints,
    keywords: params.keywords,
    reading_time_saved: numericTimeSaved,
    source_type: params.sourceType || "text",
    source_url: params.sourceUrl || null,
    page_title: params.pageTitle || null,
    title: params.title || null,
  };

  console.log("DEBUG [saveSummary] Exact insert payload:", insertPayload);
  console.log("DEBUG [saveSummary] title:", insertPayload.title);
  console.log("DEBUG [saveSummary] page_title:", insertPayload.page_title);
  console.log("DEBUG [saveSummary] source_type:", insertPayload.source_type);

  const { data, error } = await supabase
    .from("summaries")
    .insert(insertPayload)
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

export async function toggleFavoriteSummary(id: string, isFavorite: boolean): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to update favorites.");
  }

  const { error } = await supabase
    .from("summaries")
    .update({ favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

export async function getAllSummaries(): Promise<SummaryRecord[]> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to view summaries.");
  }

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data as SummaryRecord[];
}

export async function getMonthlyTextSummaryCount(): Promise<number> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized: Please log in to view summaries.");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("summaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source_type", "text")
    .gte("created_at", startOfMonth);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return count ?? 0;
}

export async function getProfileUsageAndLimit(userId?: string) {
  const supabase = await createClient();
  let targetUserId = userId;

  if (!targetUserId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Please log in.");
    }
    targetUserId = user.id;
  }

  let profile: any = null;
  let hasFeedbackInDb = false;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at, feedback_completed, feedback_remind_after")
      .eq("id", targetUserId)
      .maybeSingle();

    profile = data;
  } catch (e) {
    console.warn("Notice: Fetch profile info warning:", e);
  }

  // Check public.feedback table directly as database source of truth
  try {
    const { count: feedbackCount } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    if (feedbackCount && feedbackCount > 0) {
      hasFeedbackInDb = true;
    }
  } catch (e) {
    // Ignore schema or network warning silently
  }

  const now = new Date();
  let plan: "free" | "pro" = profile?.plan === "pro" ? "pro" : "free";

  if (plan === "pro" && profile?.plan_expires_at) {
    const expires = new Date(profile.plan_expires_at);
    if (expires.getTime() < now.getTime()) {
      plan = "free";
    }
  }

  // Derive usage for the current billing period (current month) directly from public.summaries
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let textUsage = 0;
  let pdfUsage = 0;
  let urlUsage = 0;

  try {
    const { count: textCount } = await supabase
      .from("summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .or("source_type.eq.text,source_type.is.null")
      .gte("created_at", startOfMonth);

    textUsage = textCount ?? 0;

    const { count: pdfCount } = await supabase
      .from("summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("source_type", "pdf")
      .gte("created_at", startOfMonth);

    pdfUsage = pdfCount ?? 0;

    const { count: urlCount } = await supabase
      .from("summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("source_type", "url")
      .gte("created_at", startOfMonth);

    urlUsage = urlCount ?? 0;
  } catch (e) {
    console.warn("Notice: Error counting monthly summaries from database:", e);
  }

  const textLimit = plan === "pro" ? -1 : 10;
  const pdfLimit = plan === "pro" ? -1 : 2;
  const urlLimit = plan === "pro" ? -1 : 2;

  // Next reset date is the 1st of next month
  const nextMonthReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const isFeedbackCompleted = hasFeedbackInDb || (profile?.feedback_completed ?? false);

  return {
    plan,
    textUsage,
    textLimit,
    pdfUsage,
    pdfLimit,
    urlUsage,
    urlLimit,
    usageResetAt: nextMonthReset,
    monthlyUsage: textUsage,
    monthlyLimit: textLimit,
    remaining: plan === "pro" ? null : Math.max(0, textLimit - textUsage),
    feedbackCompleted: isFeedbackCompleted,
    feedbackRemindAfter: profile?.feedback_remind_after ?? 0,
  };
}

export async function incrementFeatureUsage(userId: string, sourceType: string = "text") {
  const supabase = await createClient();

  try {
    const { data: profile, error: selectErr } = await supabase
      .from("profiles")
      .select("text_usage, pdf_usage, url_usage, monthly_usage")
      .eq("id", userId)
      .single();

    if (selectErr && (selectErr.code === "42703" || selectErr.message?.includes("does not exist"))) {
      console.warn("⚠️ DATABASE MIGRATION REQUIRED: Skipping usage increment until SQL migration is executed.");
      return;
    }

    const updateData: Record<string, number> = {};

    if (sourceType === "pdf") {
      const current = profile?.pdf_usage ?? 0;
      updateData.pdf_usage = current + 1;
    } else if (sourceType === "url") {
      const current = profile?.url_usage ?? 0;
      updateData.url_usage = current + 1;
    } else {
      const current = profile?.text_usage ?? profile?.monthly_usage ?? 0;
      updateData.text_usage = current + 1;
      updateData.monthly_usage = current + 1;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateErr) {
      if (updateErr.code === "42703" || updateErr.message?.includes("does not exist")) {
        console.warn("⚠️ DATABASE MIGRATION REQUIRED: Skipping usage update until SQL migration is executed.");
      } else {
        console.error(`Error incrementing ${sourceType} usage:`, updateErr);
      }
    }
  } catch (err) {
    console.warn(`Safe handling of increment ${sourceType} usage failure:`, err);
  }
}

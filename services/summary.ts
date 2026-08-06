import { saveSummary, getRecentSummaries, deleteSummary, toggleFavoriteSummary, getAllSummaries, getMonthlyTextSummaryCount, getProfileUsageAndLimit, incrementFeatureUsage } from "./supabase";
import { SummaryRecord, UsageInfo } from "@/types";

export interface CreateSummaryParams {
  originalText: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
  sourceType?: string;
  sourceUrl?: string;
  pageTitle?: string;
  title?: string;
}

/**
 * Summary Service handles all business operations and database interactions
 * for content summaries (saving, retrieving, deleting).
 */
export async function createSummary(params: CreateSummaryParams): Promise<SummaryRecord> {
  return saveSummary(params);
}

export async function fetchRecentSummaries(): Promise<SummaryRecord[]> {
  return getRecentSummaries();
}

export async function removeSummary(id: string): Promise<void> {
  return deleteSummary(id);
}

export async function updateFavoriteSummary(id: string, isFavorite: boolean): Promise<void> {
  return toggleFavoriteSummary(id, isFavorite);
}

export async function fetchAllSummaries(): Promise<SummaryRecord[]> {
  return getAllSummaries();
}

export async function fetchMonthlyTextSummaryCount(): Promise<number> {
  return getMonthlyTextSummaryCount();
}

export async function fetchProfileUsage(userId?: string): Promise<UsageInfo> {
  return getProfileUsageAndLimit(userId);
}

export async function incrementUserMonthlyUsage(userId: string, sourceType: string = "text"): Promise<void> {
  return incrementFeatureUsage(userId, sourceType);
}

export type FeatureKey =
  | "TEXT_SUMMARY"
  | "PDF_SUMMARY"
  | "URL_SUMMARY"
  | "EXPORT_PDF"
  | "EXPORT_MD"
  | "EXPORT_TXT"
  | "ASK_AI"
  | "SHARE";

export interface FeatureQuotaConfig {
  key: FeatureKey;
  label: string;
  freeLimit: number;
}

export const FEATURE_QUOTAS: Record<FeatureKey, FeatureQuotaConfig> = {
  TEXT_SUMMARY: {
    key: "TEXT_SUMMARY",
    label: "Text Summaries",
    freeLimit: 10,
  },
  PDF_SUMMARY: {
    key: "PDF_SUMMARY",
    label: "PDF Summaries",
    freeLimit: 2,
  },
  URL_SUMMARY: {
    key: "URL_SUMMARY",
    label: "URL Summaries",
    freeLimit: 2,
  },
  EXPORT_PDF: {
    key: "EXPORT_PDF",
    label: "Export PDF",
    freeLimit: 2,
  },
  EXPORT_MD: {
    key: "EXPORT_MD",
    label: "Export Markdown",
    freeLimit: 2,
  },
  EXPORT_TXT: {
    key: "EXPORT_TXT",
    label: "Export TXT",
    freeLimit: 2,
  },
  ASK_AI: {
    key: "ASK_AI",
    label: "Ask AI Requests",
    freeLimit: 2,
  },
  SHARE: {
    key: "SHARE",
    label: "Shares",
    freeLimit: 2,
  },
};

export function getFeatureLimit(feature: FeatureKey, plan: "free" | "pro"): number {
  if (plan === "pro") return -1;
  return FEATURE_QUOTAS[feature]?.freeLimit ?? 2;
}

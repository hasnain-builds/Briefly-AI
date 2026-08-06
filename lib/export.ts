import { jsPDF } from "jspdf";

export interface ExportParams {
  title?: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  date?: string;

  // Fallbacks
  page_title?: string;
  pageTitle?: string;
  filename?: string;
  fileName?: string;
  created_at?: string;
  createdAt?: string;
  source_type?: string;
  sourceType?: string;
  original_text?: string;
  originalText?: string;
}

/**
 * Resolves title, date, and clean filename with fallbacks for export functions.
 */
function resolveMetadata(params: ExportParams, extension: "pdf" | "md" | "txt") {
  // 1. Resolve Title
  // Fallbacks:
  // - params.title
  // - params.page_title / params.pageTitle
  // - params.filename / params.fileName
  // - "Summary"
  let title = "";

  const rawTitle = params.title || params.page_title || params.pageTitle || params.filename || params.fileName;
  if (rawTitle && String(rawTitle) !== "undefined" && String(rawTitle) !== "null" && String(rawTitle).trim() !== "") {
    title = String(rawTitle).trim();
  }

  if (!title) {
    if (params.summary) {
      const firstSentence = params.summary.split(/[.!?]/)[0].trim();
      if (firstSentence) {
        const words = firstSentence.split(/\s+/);
        title = words.length > 7 ? words.slice(0, 7).join(" ") + "..." : firstSentence + ".";
      }
    }
  }

  if (!title || title === "undefined" || title === "null") {
    title = "Summary";
  }

  // 2. Resolve Date
  // Fallbacks:
  // - params.date
  // - params.created_at / params.createdAt
  // - Current Date
  let dateVal = "";
  const rawDate = params.date || params.created_at || params.createdAt;
  if (rawDate && String(rawDate) !== "undefined" && String(rawDate) !== "null" && String(rawDate).trim() !== "") {
    try {
      const d = new Date(String(rawDate));
      if (!isNaN(d.getTime())) {
        dateVal = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } else {
        dateVal = String(rawDate);
      }
    } catch {
      dateVal = String(rawDate);
    }
  }

  if (!dateVal || dateVal === "undefined" || dateVal === "null" || dateVal === "Recent") {
    dateVal = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // 3. Resolve Filename
  // Filename example: cockroach-survival-summary.pdf, india-wikipedia-summary.pdf, operating-system-summary.pdf
  // If no title exists: summary-YYYY-MM-DD.pdf
  let resolvedFilename = "";
  const hasMeaningfulTitle = title && title !== "Summary";

  if (hasMeaningfulTitle) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "");   // remove leading/trailing hyphens

    if (slug) {
      resolvedFilename = `${slug}-summary.${extension}`;
    }
  }

  if (!resolvedFilename) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    resolvedFilename = `summary-${yyyy}-${mm}-${dd}.${extension}`;
  }

  return { title, date: dateVal, filename: resolvedFilename };
}

/**
 * Downloads the summary as a professionally formatted PDF.
 */
export function exportToPDF(params: ExportParams) {
  try {
    const { title, date, filename } = resolveMetadata(params, "pdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    // Helper to add text and handle page breaks
    const addWrappedText = (
      text: string,
      fontSize: number,
      style: "normal" | "bold" | "italic" = "normal",
      color: [number, number, number] = [30, 30, 30],
      spacing = 6
    ) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      const lines = doc.splitTextToSize(text, contentWidth);
      const textHeight = lines.length * (fontSize * 0.3527) + spacing; // pt to mm conversion + spacing

      if (y + textHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(lines, margin, y);
      y += textHeight;
    };

    // 1. Header Title
    addWrappedText(title, 18, "bold", [24, 24, 27], 8);

    // 2. Date
    addWrappedText(`Generated on: ${date}`, 9, "normal", [113, 113, 122], 10);

    // 3. Decorative Divider Line
    doc.setDrawColor(228, 228, 231); // light gray border-zinc-200
    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);
    y += 5;

    // 4. Summary Section
    addWrappedText("Summary Overview", 13, "bold", [79, 70, 229], 5); // Indigo accent
    addWrappedText(params.summary, 10, "normal", [39, 39, 42], 10);

    // 5. Key Points Takeaways
    if (params.keyPoints && params.keyPoints.length > 0) {
      addWrappedText("Key Takeaways", 13, "bold", [79, 70, 229], 5);
      params.keyPoints.forEach((point) => {
        addWrappedText(`•  ${point}`, 10, "normal", [39, 39, 42], 4.5);
      });
      y += 5; // spacing
    }

    // 6. Keywords Section
    if (params.keywords && params.keywords.length > 0) {
      addWrappedText("Keywords", 13, "bold", [79, 70, 229], 5);
      addWrappedText(params.keywords.join(", "), 10, "normal", [63, 63, 70], 10);
    }

    // 7. Footer - Add page numbers dynamically
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400

      // Right-aligned page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );

      // Left-aligned attribution
      doc.text(
        "Generated by Briefly AI Summarizer",
        margin,
        pageHeight - 10
      );
    }

    doc.save(filename);
  } catch (error) {
    console.error("PDF Export error:", error);
    throw new Error("Could not generate PDF. Please try again.");
  }
}

/**
 * Downloads the summary as a Markdown (.md) file.
 */
export function exportToMarkdown(params: ExportParams) {
  try {
    const { title, date, filename } = resolveMetadata(params, "md");

    const markdownContent = `# ${title}

*Generated on: ${date}*

---

## Summary Overview
${params.summary}

## Key Takeaways
${params.keyPoints.map((point) => `- ${point}`).join("\n")}

## Keywords
\`${params.keywords.join(", ")}\`

---
*Created using Briefly AI Content Summarizer*
`;

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Markdown Export error:", error);
    throw new Error("Could not generate Markdown file.");
  }
}

/**
 * Downloads the summary as a plain Text (.txt) file.
 */
export function exportToTxt(params: ExportParams) {
  try {
    const { title, date, filename } = resolveMetadata(params, "txt");

    const textContent = `${title}
Generated on: ${date}
==================================================

SUMMARY OVERVIEW:
${params.summary}

KEY TAKEAWAYS:
${params.keyPoints.map((point) => `• ${point}`).join("\n")}

KEYWORDS:
${params.keywords.join(", ")}

==================================================
Created using Briefly AI Content Summarizer
`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("TXT Export error:", error);
    throw new Error("Could not generate Text file.");
  }
}

/**
 * Tries to share summary using Native Browser Share API, or copies a shareable snippet.
 */
export async function shareSummaryContent(params: {
  title?: string;
  summary: string;
  keywords?: string[];
  page_title?: string;
  pageTitle?: string;
  filename?: string;
  fileName?: string;
  source_url?: string;
  sourceUrl?: string;
}): Promise<"shared" | "copied"> {
  // Determine title based on priority:
  // 1. title
  // 2. page_title
  // 3. uploaded PDF filename (without extension)
  // 4. webpage title
  // 5. "Summary"
  let resolvedTitle = "";

  // 1. title
  if (params.title && String(params.title) !== "undefined" && String(params.title) !== "null" && String(params.title).trim() !== "") {
    resolvedTitle = String(params.title).trim();
  }

  // 2. page_title
  if (!resolvedTitle) {
    const pt = params.page_title || params.pageTitle;
    if (pt && String(pt) !== "undefined" && String(pt) !== "null" && String(pt).trim() !== "") {
      resolvedTitle = String(pt).trim();
    }
  }

  // 3. uploaded PDF filename (without extension)
  if (!resolvedTitle) {
    const fn = params.filename || params.fileName;
    if (fn && String(fn) !== "undefined" && String(fn) !== "null" && String(fn).trim() !== "") {
      resolvedTitle = fn.replace(/\.[^/.]+$/, "").trim();
    }
  }

  // 4. webpage title
  if (!resolvedTitle) {
    const pt = params.page_title || params.pageTitle;
    if (pt && String(pt) !== "undefined" && String(pt) !== "null" && String(pt).trim() !== "") {
      resolvedTitle = String(pt).trim();
    } else {
      const su = params.source_url || params.sourceUrl;
      if (su && String(su) !== "undefined" && String(su) !== "null" && String(su).trim() !== "") {
        try {
          const urlObj = new URL(String(su));
          let host = urlObj.hostname;
          if (host.startsWith("www.")) {
            host = host.substring(4);
          }
          if (host.trim() !== "") {
            resolvedTitle = host.trim();
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // 5. "Summary" fallback
  if (!resolvedTitle || resolvedTitle === "undefined" || resolvedTitle === "null") {
    resolvedTitle = "Summary";
  }

  // Format the share payload:
  const kwList = params.keywords && params.keywords.length > 0 ? params.keywords.join(", ") : "None";
  
  let shareText = `📄 Summary generated with Briefly AI

Title:
${resolvedTitle}

Summary:
${params.summary}

Keywords:
${kwList}

✨ Created using Briefly AI`;

  // Check if running in deployed environment (non-localhost)
  const isDeployed = typeof window !== "undefined" && 
    window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1";

  if (isDeployed) {
    shareText += `\n\nhttps://briefly-ai.vercel.app`;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: resolvedTitle,
        text: shareText,
      });
      return "shared";
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw err;
      }
      // fall back to copy
    }
  }

  await navigator.clipboard.writeText(shareText);
  return "copied";
}

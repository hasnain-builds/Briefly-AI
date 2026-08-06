"use client";

import type * as PDFJS from "pdfjs-dist";

export interface PDFExtractionProgress {
  currentPage: number;
  totalPages: number;
  status: "loading" | "extracting" | "completed" | "failed";
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  fileName: string;
  fileSize: number;
}

let pdfjsInstance: typeof PDFJS | null = null;

/**
 * Dynamically imports and configures pdfjs-dist only in the browser
 */
async function getPdfjsLib(): Promise<typeof PDFJS | null> {
  if (typeof window === "undefined") return null;

  if (!pdfjsInstance) {
    try {
      const pdfjs = await import("pdfjs-dist");
      // Set the worker source to the local copied worker file
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      pdfjsInstance = pdfjs;
    } catch (error) {
      console.error("Failed to load pdfjs-dist", error);
      throw new Error("Failed to initialize PDF parser. Please try again.");
    }
  }
  return pdfjsInstance;
}

/**
 * Validates and extracts text from a PDF file on the client side.
 * Supports up to 100 pages and 20 MB size limit.
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  // Validate file extension
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are accepted.");
  }

  // Limit maximum file size to 20 MB (20 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Maximum file size is 20 MB.");
  }

  const pdfjs = await getPdfjsLib();
  if (!pdfjs) {
    throw new Error("PDF parser is only available in the browser.");
  }

  onProgress?.({ currentPage: 0, totalPages: 0, status: "loading" });

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Disable web workers to make it robust and prevent sandbox issues if standard workers are blocked
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
    });
    
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    // Support PDFs up to 100 pages
    if (totalPages > 100) {
      throw new Error("PDF contains too many pages. Support is limited to PDFs up to 100 pages.");
    }

    let fullText = "";

    for (let i = 1; i <= totalPages; i++) {
      onProgress?.({ currentPage: i, totalPages, status: "extracting" });

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");

      fullText += pageText + "\n";
    }

    const trimmedText = fullText.trim();
    if (!trimmedText) {
      throw new Error("This PDF does not contain extractable text.");
    }

    onProgress?.({ currentPage: totalPages, totalPages, status: "completed" });

    return {
      text: trimmedText,
      pageCount: totalPages,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error: any) {
    onProgress?.({ currentPage: 0, totalPages: 0, status: "failed" });

    // Handle password/encrypted PDFs
    if (
      error.name === "PasswordException" || 
      error.message?.includes("password") || 
      error.message?.includes("encrypted")
    ) {
      throw new Error("Encrypted or password-protected PDFs are not supported.");
    }

    // Handle corrupted/invalid PDFs
    if (
      error.name === "InvalidPDFException" || 
      error.message?.includes("Invalid PDF") || 
      error.message?.includes("corrupted")
    ) {
      throw new Error("This PDF is corrupted or invalid.");
    }

    // Pass through specific validation errors
    if (
      error.message === "Maximum file size is 20 MB." ||
      error.message === "PDF contains too many pages. Support is limited to PDFs up to 100 pages." ||
      error.message === "This PDF does not contain extractable text."
    ) {
      throw error;
    }

    throw new Error(error.message || "An error occurred during PDF text extraction.");
  }
}


export interface URLExtractionResult {
  text: string;
  title: string;
  author: string | null;
  publishDate: string | null;
  url: string;
}

/**
 * Validates if the given string is a valid http:// or https:// URL.
 */
export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Fetches webpage content and extracts title, main article text, author, and date.
 * Excludes headers, footers, sidebars, navigation, ads, and scripts.
 */
export async function extractTextFromURL(url: string): Promise<URLExtractionResult> {
  if (!isValidUrl(url)) {
    throw new Error("Invalid URL format. Only HTTP/HTTPS URLs are accepted.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  let html: string;
  let response: Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Connection timed out. Please try again.");
    }
    throw new Error("Unable to connect to the website. Please check the URL and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 401 || response.status === 999) {
      throw new Error("This website blocked our request. Please copy and paste the text manually.");
    }
    throw new Error(`Unable to fetch content. Server responded with status ${response.status}.`);
  }

  try {
    html = await response.text();
  } catch {
    throw new Error("Unable to read webpage content.");
  }

 try {
  const { JSDOM } = await import("jsdom");
  const { Readability } = await import("@mozilla/readability");

  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

    // Remove scripts, styles, and other non-content tags before readability parser
    const tagsToRemove = ["script", "style", "noscript", "iframe", "svg"];
    tagsToRemove.forEach((tag) => {
      document.querySelectorAll(tag).forEach((el) => el.remove());
    });

    // Extract publish date from meta tags
    let publishDate: string | null = null;
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="pubdate"]',
      'meta[name="publish-date"]',
      'meta[itemprop="datePublished"]',
      'meta[property="og:article:published_time"]'
    ];
    for (const selector of dateSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const content = el.getAttribute("content") || el.getAttribute("value");
        if (content) {
          publishDate = content.trim();
          break;
        }
      }
    }

    // Try parsing the document with Readability
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent || !article.textContent.trim()) {
      throw new Error("Unable to extract readable content from this website.");
    }

    // Clean up JSDOM window
    dom.window.close();

    return {
      text: article.textContent.trim(),
      title: article.title || document.title || "Untitled Webpage",
      author: article.byline ? article.byline.trim() : null,
      publishDate,
      url,
    };
  } catch (error: any) {
    if (error.message === "Unable to extract readable content from this website.") {
      throw error;
    }
    throw new Error("Unable to extract readable content from this website.");
  }
}

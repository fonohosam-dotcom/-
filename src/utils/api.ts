/**
 * Safe fetch wrapper that automatically converts relative API paths (e.g., /api/...)
 * into absolute URLs using the current window.location.href.
 * This ensures fetch works correctly inside sandboxed or null-origin iframe environments
 * where relative fetches would otherwise fail.
 */
export function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let target = input;
  try {
    let origin = window.location.href;
    
    // Fallback if inside a sandboxed iframe with null/about:srcdoc location
    if (!origin || !origin.startsWith("http")) {
      if (document.referrer && document.referrer.startsWith("http")) {
        origin = document.referrer;
      } else {
        // Try same-origin parent fallback
        try {
          if (window.parent && window.parent.location && window.parent.location.href.startsWith("http")) {
            origin = window.parent.location.href;
          }
        } catch (_) {}
      }
    }

    if (origin && origin.startsWith("http")) {
      if (typeof input === "string" && input.startsWith("/api/")) {
        target = new URL(input, origin).href;
      } else if (input instanceof URL && input.pathname.startsWith("/api/")) {
        target = new URL(input.pathname + input.search, origin).href;
      }
    }
  } catch (e) {
    console.error("Error in fetch URL resolution:", e);
  }
  return window.fetch(target, init);
}

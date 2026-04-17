const MAX_URL_LENGTH = 2048;

export type NormalizeLessonLinkUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

function isAllowedHttpUrl(trimmed: string): boolean {
  if (!trimmed) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }
  return Boolean(parsed.hostname);
}

/** Canonicalize and validate lesson external link URLs (aligned with `@conductor/contracts` lesson link URL rules). */
export function normalizeLessonLinkUrl(raw: string): NormalizeLessonLinkUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "URL cannot be empty" };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, message: `URL must be at most ${MAX_URL_LENGTH} characters` };
  }
  if (!isAllowedHttpUrl(trimmed)) {
    return {
      ok: false,
      message: "Only http and https URLs with a valid host are allowed"
    };
  }
  return { ok: true, url: trimmed };
}

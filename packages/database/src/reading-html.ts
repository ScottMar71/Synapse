/**
 * Reading lesson bodies are stored as HTML in `Lesson.content` and sanitized on **write** (staff PATCH)
 * and again on **read** (learner GET) so stored XSS cannot reach the browser.
 *
 * Strategy: **server-side allowlist** via `sanitize-html` — permitted tags/attributes/schemes only
 * (headings, lists, links with http(s)/mailto, images with http(s) `src`, etc.). Scripts, inline event
 * handlers, and dangerous URLs are stripped. See `sanitizeOptions` below for the exact allowlist.
 */
import sanitizeHtml from "sanitize-html";

export const READING_HTML_MAX_LENGTH = 500_000;

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "sub",
    "sup",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "span",
    "div",
    "img",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["id"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] }
};

export function sanitizeReadingHtml(raw: string): string {
  return sanitizeHtml(raw, sanitizeOptions);
}

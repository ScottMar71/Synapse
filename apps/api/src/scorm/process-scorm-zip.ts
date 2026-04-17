import { strFromU8, unzipSync } from "fflate";

const MAX_UNCOMPRESSED_BYTES = 400 * 1024 * 1024;
const MAX_FILE_COUNT = 4000;

export type ScormZipExtractOk = {
  ok: true;
  files: Array<{ path: string; body: Uint8Array }>;
  manifestXml: string;
  /** Directory containing imsmanifest.xml (no trailing slash), or "" if at zip root. */
  manifestDir: string;
};

export type ScormZipExtractResult = ScormZipExtractOk | { ok: false; error: string };

function normalizeZipEntryName(name: string): string | null {
  const n = name.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!n || n.endsWith("/")) {
    return null;
  }
  const segments = n.split("/").filter((s) => s.length > 0);
  for (const s of segments) {
    if (s === "." || s === "..") {
      return null;
    }
  }
  return segments.join("/");
}

export function extractScormZipEntries(zipBytes: Uint8Array): ScormZipExtractResult {
  let parsed: Record<string, Uint8Array>;
  try {
    parsed = unzipSync(zipBytes);
  } catch {
    return { ok: false, error: "Invalid or corrupted zip file" };
  }

  const files: Array<{ path: string; body: Uint8Array }> = [];
  let uncompressedTotal = 0;

  for (const [rawPath, body] of Object.entries(parsed)) {
    const path = normalizeZipEntryName(rawPath);
    if (!path) {
      continue;
    }
    uncompressedTotal += body.byteLength;
    if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) {
      return { ok: false, error: "Package uncompressed size exceeds limit" };
    }
    files.push({ path, body });
    if (files.length > MAX_FILE_COUNT) {
      return { ok: false, error: "Package contains too many files" };
    }
  }

  const manifestIdx = files.findIndex((f) => f.path.toLowerCase().endsWith("imsmanifest.xml"));
  if (manifestIdx === -1) {
    return { ok: false, error: "imsmanifest.xml not found in package" };
  }

  const manifestEntry = files[manifestIdx]!;
  const manifestDir =
    manifestEntry.path.toLowerCase() === "imsmanifest.xml"
      ? ""
      : manifestEntry.path.slice(0, -"imsmanifest.xml".length).replace(/\/+$/, "");

  let manifestXml: string;
  try {
    manifestXml = strFromU8(manifestEntry.body, true);
  } catch {
    return { ok: false, error: "imsmanifest.xml is not valid UTF-8" };
  }
  if (!manifestXml.trim()) {
    return { ok: false, error: "imsmanifest.xml is empty" };
  }

  return { ok: true, files, manifestXml, manifestDir };
}

export function guessContentTypeFromPath(relativePath: string): string {
  const ext = relativePath.includes(".")
    ? relativePath.split(".").pop()?.toLowerCase() ?? ""
    : "";
  const mimeByExt: Record<string, string> = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    xml: "application/xml",
    swf: "application/x-shockwave-flash",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject"
  };
  return mimeByExt[ext] ?? "application/octet-stream";
}

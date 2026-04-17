import { XMLParser } from "fast-xml-parser";

export type ImsManifestParseResult =
  | { ok: true; profile: "SCORM_12"; launchPath: string; title?: string }
  | { ok: true; profile: "UNSUPPORTED_SCORM_2004"; detail: string }
  | { ok: false; error: string };

function detectUnsupported2004(xml: string): string | null {
  const lower = xml.toLowerCase();
  if (lower.includes("http://www.adlnet.org/xsd/adlcp_v1p3")) {
    return "SCORM 2004 (adlcp v1p3) is not supported in this version";
  }
  if (lower.includes("http://www.imsglobal.org/xsd/imscp_v1p1")) {
    // IMS CP 1.1 alone is ambiguous; combine with schema ADL version tags.
  }
  if (/<schemaversion[^>]*>\s*cam\s*1\.3\s*<\/schemaversion>/i.test(xml)) {
    return "SCORM 2004 (CAM 1.3) is not supported in this version";
  }
  if (lower.includes("2004 4th edition")) {
    return "SCORM 2004 editions are not supported in this version";
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return null;
  }
  return v as Record<string, unknown>;
}

function attr(obj: Record<string, unknown>, ...names: string[]): string | undefined {
  for (const n of names) {
    const prefixed = `@_${n}`;
    const a = obj[prefixed];
    if (typeof a === "string" && a.length > 0) {
      return a;
    }
    const b = obj[n];
    if (typeof b === "string" && b.length > 0) {
      return b;
    }
  }
  return undefined;
}

function firstTitleText(node: unknown): string | undefined {
  const o = asRecord(node);
  if (!o) {
    return undefined;
  }
  const t = o.title;
  if (typeof t === "string") {
    const s = t.trim();
    return s.length > 0 ? s : undefined;
  }
  const tr = asRecord(t);
  if (tr && typeof tr["#text"] === "string") {
    const s = tr["#text"].trim();
    return s.length > 0 ? s : undefined;
  }
  return undefined;
}

function findFirstItemIdentifierRef(item: unknown): string | undefined {
  const o = asRecord(item);
  if (!o) {
    return undefined;
  }
  const ref = attr(o, "identifierref");
  if (ref) {
    return ref;
  }
  const nested = o.item;
  if (Array.isArray(nested)) {
    for (const ch of nested) {
      const r = findFirstItemIdentifierRef(ch);
      if (r) {
        return r;
      }
    }
  } else if (nested) {
    return findFirstItemIdentifierRef(nested);
  }
  return undefined;
}

function walkOrganizationsForItemRef(orgs: unknown): { itemRef?: string; title?: string } {
  const o = asRecord(orgs);
  if (!o) {
    return {};
  }
  const def = attr(o, "default");
  let org = o.organization;
  if (Array.isArray(org)) {
    if (def) {
      const match = org.find((x) => attr(asRecord(x) ?? {}, "identifier") === def);
      org = match ?? org[0];
    } else {
      org = org[0];
    }
  }
  const or = asRecord(org);
  if (!or) {
    return {};
  }
  const title = firstTitleText(or);
  const item = or.item;
  const items = Array.isArray(item) ? item : item ? [item] : [];
  for (const it of items) {
    const itemRef = findFirstItemIdentifierRef(it);
    if (itemRef) {
      return { itemRef, title };
    }
  }
  return { title };
}

function collectResources(manifest: Record<string, unknown>): Array<Record<string, unknown>> {
  const resources = manifest.resources;
  const r = asRecord(resources);
  if (!r) {
    return [];
  }
  const res = r.resource;
  if (Array.isArray(res)) {
    return res.filter((x): x is Record<string, unknown> => asRecord(x) !== null) as Array<
      Record<string, unknown>
    >;
  }
  const one = asRecord(res);
  return one ? [one] : [];
}

function findResourceById(
  resources: Array<Record<string, unknown>>,
  id: string
): Record<string, unknown> | undefined {
  return resources.find((r) => attr(r, "identifier") === id);
}

function isScormScoResource(r: Record<string, unknown>): boolean {
  const fromAttr = attr(r, "scormtype", "adlcp:scormtype")?.toLowerCase();
  if (fromAttr === "sco") {
    return true;
  }
  for (const [key, val] of Object.entries(r)) {
    if (!key.startsWith("@_")) {
      continue;
    }
    if (!key.toLowerCase().includes("scormtype")) {
      continue;
    }
    if (typeof val === "string" && val.toLowerCase() === "sco") {
      return true;
    }
  }
  return false;
}

/**
 * Resolve `href` from imsmanifest relative to zip root using manifest directory.
 */
export function resolveLaunchPathFromHref(manifestDir: string, href: string): string {
  const h = href.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!h) {
    return "";
  }
  const base = manifestDir.length > 0 ? `${manifestDir}/` : "";
  const combined = `${base}${h}`.replace(/\\/g, "/");
  const segments = combined.split("/").filter((s) => s.length > 0);
  const out: string[] = [];
  for (const s of segments) {
    if (s === "..") {
      out.pop();
    } else if (s !== ".") {
      out.push(s);
    }
  }
  return out.join("/");
}

export function parseImsManifestXml(xml: string): ImsManifestParseResult {
  const unsupported = detectUnsupported2004(xml);
  if (unsupported) {
    return { ok: true, profile: "UNSUPPORTED_SCORM_2004", detail: unsupported };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    trimValues: true
  });

  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    return { ok: false, error: "imsmanifest.xml is not valid XML" };
  }

  const root = asRecord(doc)?.manifest ?? asRecord(doc);
  const manifest = asRecord(root);
  if (!manifest) {
    return { ok: false, error: "imsmanifest root element not found" };
  }

  const { itemRef, title } = walkOrganizationsForItemRef(manifest.organizations);
  if (!itemRef) {
    return { ok: false, error: "No launch item found in imsmanifest organizations" };
  }

  const resources = collectResources(manifest);
  const resource = findResourceById(resources, itemRef);
  if (!resource) {
    return { ok: false, error: `Resource "${itemRef}" not found in imsmanifest` };
  }

  if (!isScormScoResource(resource)) {
    return { ok: false, error: "Launch resource is not a SCORM SCO" };
  }

  const href = attr(resource, "href", "adlcp:location");
  if (!href) {
    return { ok: false, error: "Launch resource has no href" };
  }

  return { ok: true, profile: "SCORM_12", launchPath: href, title };
}

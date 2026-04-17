import { normalizeScormAssetRelativePath } from "@conductor/database";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { parseImsManifestXml } from "./imsmanifest";
import { extractScormZipEntries } from "./process-scorm-zip";

const minimalManifest = `<?xml version="1.0"?>
<manifest identifier="m1" version="1.2" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <organizations default="o1">
    <organization identifier="o1">
      <title>T</title>
      <item identifier="i1" identifierref="r1"><title>S</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="r1" type="webcontent" adlcp:scormtype="sco" href="index.html"/>
  </resources>
</manifest>`;

function minimalZip(): Uint8Array {
  return zipSync({
    "imsmanifest.xml": strToU8(minimalManifest),
    "index.html": strToU8("<html></html>")
  });
}

describe("SCORM manifest + zip helpers", () => {
  it("parses SCORM 1.2 imsmanifest and resolves launch href", () => {
    const parsed = parseImsManifestXml(minimalManifest);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.profile !== "SCORM_12") {
      throw new Error("expected SCORM_12");
    }
    expect(parsed.launchPath).toBe("index.html");
  });

  it("rejects SCORM 2004 manifests", () => {
    const xml = minimalManifest.replace(
      "http://www.adlnet.org/xsd/adlcp_rootv1p2",
      "http://www.adlnet.org/xsd/adlcp_v1p3"
    );
    const parsed = parseImsManifestXml(xml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.profile !== "UNSUPPORTED_SCORM_2004") {
      throw new Error("expected unsupported 2004");
    }
  });

  it("extracts imsmanifest and files from zip", () => {
    const zip = minimalZip();
    const ex = extractScormZipEntries(zip);
    expect(ex.ok).toBe(true);
    if (!ex.ok) {
      throw new Error(ex.error);
    }
    expect(ex.manifestDir).toBe("");
    expect(ex.files.some((f) => f.path === "index.html")).toBe(true);
  });

  it("rejects path traversal in asset relative paths", () => {
    const bad = normalizeScormAssetRelativePath("../secret");
    expect(bad.ok).toBe(false);
  });
});

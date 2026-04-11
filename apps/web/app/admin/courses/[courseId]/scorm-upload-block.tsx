"use client";

import type { ChangeEvent, ReactElement } from "react";
import { useId, useState } from "react";

import styles from "./course-wireframe.module.css";

export function ScormUploadBlock(): ReactElement {
  const inputId = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>SCORM package</h2>
      <div className={styles.scormZone}>
        <p>
          Drop a SCORM 1.2 or 2004 zip here, or choose a file. Parsing and manifest
          validation would run after upload (wireframe only).
        </p>
        <input
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept=".zip,application/zip"
          onChange={onChange}
        />
        <label htmlFor={inputId} className={styles.primaryBtn}>
          Select package
        </label>
        {fileName ? (
          <p className={styles.hint} role="status">
            Selected: {fileName}
          </p>
        ) : (
          <p className={styles.hint}>Accepted: .zip (imsmanifest.xml inside)</p>
        )}
      </div>
    </div>
  );
}

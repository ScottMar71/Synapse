"use client";

import type { ChangeEvent, ReactElement } from "react";
import { useId, useState } from "react";

import styles from "./course-wireframe.module.css";

export function DocumentUploadBlock(): ReactElement {
  const inputId = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Course documents</h2>
      <div className={styles.scormZone}>
        <p>
          Upload reference files for authors or learners: syllabi, PDFs, worksheets, or
          office documents. Virus scan and storage quotas would apply in production.
        </p>
        <input
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onChange}
        />
        <label htmlFor={inputId} className={styles.primaryBtn}>
          Select document
        </label>
        {fileName ? (
          <p className={styles.hint} role="status">
            Selected: {fileName}
          </p>
        ) : (
          <p className={styles.hint}>Accepted: PDF, Word, PowerPoint, Excel, text, Markdown</p>
        )}
      </div>
    </div>
  );
}

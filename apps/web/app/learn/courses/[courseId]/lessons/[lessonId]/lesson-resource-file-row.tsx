"use client";

import type { LessonFileAttachmentDto } from "@conductor/contracts";
import { Button } from "@conductor/ui";
import type { ReactElement } from "react";

import styles from "./lesson-resources-panel.module.css";

function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  }
  const gb = mb / 1024;
  return `${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB`;
}

export function LessonResourceFileRow({
  file,
  downloadBusyId,
  onDownload
}: {
  file: LessonFileAttachmentDto;
  downloadBusyId: string | null;
  onDownload: (file: LessonFileAttachmentDto) => void;
}): ReactElement {
  const typeLabel = file.mimeType || "Unknown type";
  return (
    <li className={styles.resourceItem}>
      <div className={styles.fileResourceRow}>
        <span className={styles.fileName}>{file.fileName}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={downloadBusyId === file.id}
          disabled={downloadBusyId !== null && downloadBusyId !== file.id}
          onClick={() => {
            onDownload(file);
          }}
          aria-label={`Download ${file.fileName}`}
        >
          Download
        </Button>
      </div>
      <p className={styles.resourceDescription}>
        {formatByteSize(file.sizeBytes)} · {typeLabel}
      </p>
      {file.description ? (
        <p className={styles.resourceDescription}>{file.description}</p>
      ) : null}
    </li>
  );
}

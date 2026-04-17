"use client";

import type {
  LessonExternalLinkDto,
  LessonFileAttachmentDto,
  LessonGlossaryEntryDto
} from "@conductor/contracts";
import { Button, Link as UiLink } from "@conductor/ui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { fetchLessonFileDownload, type LmsApiSession } from "../../../../../../lib/lms-api-client";

import { sortGlossaryEntries, sortLessonFiles, sortLessonLinks } from "./learner-lesson-types";
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

export function LessonResourcesPanel({
  session,
  courseId,
  lessonId,
  lessonFiles,
  lessonLinks,
  lessonGlossary
}: {
  session: LmsApiSession;
  courseId: string;
  lessonId: string;
  lessonFiles: LessonFileAttachmentDto[];
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
}): ReactElement | null {
  const sortedFiles = sortLessonFiles(lessonFiles);
  const sortedLessonLinks = sortLessonLinks(lessonLinks);
  const sortedGlossary = sortGlossaryEntries(lessonGlossary);
  const hasFiles = sortedFiles.length > 0;
  const hasResourceLinks = sortedLessonLinks.length > 0;
  const hasGlossary = sortedGlossary.length > 0;
  const [downloadBusyId, setDownloadBusyId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const onDownload = useCallback(
    async (file: LessonFileAttachmentDto): Promise<void> => {
      setDownloadError(null);
      setDownloadBusyId(file.id);
      try {
        const res = await fetchLessonFileDownload(session, courseId, lessonId, file.id);
        if (!res.ok) {
          setDownloadError(res.error.message);
          return;
        }
        window.open(res.download.url, "_blank", "noopener,noreferrer");
      } finally {
        setDownloadBusyId(null);
      }
    },
    [session, courseId, lessonId]
  );

  if (!hasFiles && !hasResourceLinks && !hasGlossary) {
    return null;
  }
  return (
    <section aria-labelledby="lesson-resources-heading">
      <h2 id="lesson-resources-heading" className={styles.resourcesHeading}>
        Resources
      </h2>
      {hasFiles ? (
        <ul className={styles.resourceList}>
          {sortedFiles.map((file) => {
            const typeLabel = file.mimeType || "Unknown type";
            return (
              <li key={file.id} className={styles.resourceItem}>
                <div className={styles.fileResourceRow}>
                  <span className={styles.fileName}>{file.fileName}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={downloadBusyId === file.id}
                    disabled={downloadBusyId !== null && downloadBusyId !== file.id}
                    onClick={() => {
                      void onDownload(file);
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
          })}
        </ul>
      ) : null}
      {downloadError ? (
        <p className={styles.resourceDownloadError} role="alert">
          {downloadError}
        </p>
      ) : null}
      {hasResourceLinks ? (
        <ul
          className={`${styles.resourceList} ${hasFiles ? styles.resourcesSectionDivider : ""}`.trim()}
        >
          {sortedLessonLinks.map((link) => (
            <li key={link.id} className={styles.resourceItem}>
              <div className={styles.resourceRow}>
                <UiLink href={link.url} external variant="default">
                  {link.title}
                </UiLink>
              </div>
              {link.description ? (
                <p className={styles.resourceDescription}>{link.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {hasGlossary ? (
        <div
          className={hasFiles || hasResourceLinks ? styles.glossaryAfterLinks : undefined}
        >
          <h3 className={styles.glossarySectionHeading}>Glossary</h3>
          <dl className={styles.glossaryList}>
            {sortedGlossary.map((entry) => (
              <div key={entry.id} className={styles.glossaryItem}>
                <dt className={styles.glossaryTerm}>{entry.term}</dt>
                <dd className={styles.glossaryDefinition}>{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}

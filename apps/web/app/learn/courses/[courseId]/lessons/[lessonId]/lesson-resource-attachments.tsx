"use client";

import type { LessonFileAttachmentDto } from "@conductor/contracts";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { fetchLessonFileDownload, type LmsApiSession } from "../../../../../../lib/lms-api-client";

import { sortLessonFiles } from "./learner-lesson-types";
import styles from "./lesson-resources-panel.module.css";
import { LessonResourceFileRow } from "./lesson-resource-file-row";

async function openLessonFileDownload(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  file: LessonFileAttachmentDto,
  onDownloadError: (message: string | null) => void
): Promise<void> {
  const res = await fetchLessonFileDownload(session, courseId, lessonId, file.id);
  if (!res.ok) {
    onDownloadError(res.error.message);
    return;
  }
  window.open(res.download.url, "_blank", "noopener,noreferrer");
}

export function LessonResourceAttachments({
  session,
  courseId,
  lessonId,
  lessonFiles,
  onDownloadError
}: {
  session: LmsApiSession;
  courseId: string;
  lessonId: string;
  lessonFiles: LessonFileAttachmentDto[];
  onDownloadError: (message: string | null) => void;
}): ReactElement | null {
  const sortedFiles = sortLessonFiles(lessonFiles);
  const [downloadBusyId, setDownloadBusyId] = useState<string | null>(null);
  const onDownload = useCallback(
    async (file: LessonFileAttachmentDto): Promise<void> => {
      onDownloadError(null);
      setDownloadBusyId(file.id);
      try {
        await openLessonFileDownload(session, courseId, lessonId, file, onDownloadError);
      } finally {
        setDownloadBusyId(null);
      }
    },
    [session, courseId, lessonId, onDownloadError]
  );
  if (sortedFiles.length === 0) {
    return null;
  }
  return (
    <ul className={styles.resourceList}>
      {sortedFiles.map((file) => (
        <LessonResourceFileRow
          key={file.id}
          file={file}
          downloadBusyId={downloadBusyId}
          onDownload={(f) => {
            void onDownload(f);
          }}
        />
      ))}
    </ul>
  );
}

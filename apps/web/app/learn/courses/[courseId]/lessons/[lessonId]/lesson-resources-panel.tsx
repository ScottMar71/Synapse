"use client";

import type {
  LessonExternalLinkDto,
  LessonFileAttachmentDto,
  LessonGlossaryEntryDto
} from "@conductor/contracts";
import type { ReactElement } from "react";
import { useState } from "react";

import { type LmsApiSession } from "../../../../../../lib/lms-api-client";

import { LessonResourceAttachments } from "./lesson-resource-attachments";
import { LessonResourceGlossary } from "./lesson-resource-glossary";
import { LessonResourceLinks } from "./lesson-resource-links";
import styles from "./lesson-resources-panel.module.css";

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
  const hasFiles = lessonFiles.length > 0;
  const hasResourceLinks = lessonLinks.length > 0;
  const hasGlossary = lessonGlossary.length > 0;
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!hasFiles && !hasResourceLinks && !hasGlossary) {
    return null;
  }
  return (
    <section aria-labelledby="lesson-resources-heading">
      <h2 id="lesson-resources-heading" className={styles.resourcesHeading}>
        Resources
      </h2>
      <LessonResourceAttachments
        session={session}
        courseId={courseId}
        lessonId={lessonId}
        lessonFiles={lessonFiles}
        onDownloadError={setDownloadError}
      />
      {downloadError ? (
        <p className={styles.resourceDownloadError} role="alert">
          {downloadError}
        </p>
      ) : null}
      <LessonResourceLinks lessonLinks={lessonLinks} hasFiles={hasFiles} />
      <LessonResourceGlossary
        lessonGlossary={lessonGlossary}
        hasFiles={hasFiles}
        hasResourceLinks={hasResourceLinks}
      />
    </section>
  );
}

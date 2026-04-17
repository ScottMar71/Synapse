"use client";

import type { LessonExternalLinkDto } from "@conductor/contracts";
import { Link as UiLink } from "@conductor/ui";
import type { ReactElement } from "react";

import { sortLessonLinks } from "./learner-lesson-types";
import styles from "./lesson-resources-panel.module.css";

export function LessonResourceLinks({
  lessonLinks,
  hasFiles
}: {
  lessonLinks: LessonExternalLinkDto[];
  hasFiles: boolean;
}): ReactElement | null {
  const sortedLessonLinks = sortLessonLinks(lessonLinks);
  if (sortedLessonLinks.length === 0) {
    return null;
  }
  return (
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
  );
}

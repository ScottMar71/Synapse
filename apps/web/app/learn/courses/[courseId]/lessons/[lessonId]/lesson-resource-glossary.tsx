"use client";

import type { LessonGlossaryEntryDto } from "@conductor/contracts";
import type { ReactElement } from "react";

import { sortGlossaryEntries } from "./learner-lesson-types";
import styles from "./lesson-resources-panel.module.css";

export function LessonResourceGlossary({
  lessonGlossary,
  hasFiles,
  hasResourceLinks
}: {
  lessonGlossary: LessonGlossaryEntryDto[];
  hasFiles: boolean;
  hasResourceLinks: boolean;
}): ReactElement | null {
  const sortedGlossary = sortGlossaryEntries(lessonGlossary);
  if (sortedGlossary.length === 0) {
    return null;
  }
  return (
    <div className={hasFiles || hasResourceLinks ? styles.glossaryAfterLinks : undefined}>
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
  );
}

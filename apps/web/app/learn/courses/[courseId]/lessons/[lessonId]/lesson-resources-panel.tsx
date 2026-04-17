import { Link as UiLink } from "@conductor/ui";
import type { ReactElement } from "react";

import type { LessonExternalLinkDto, LessonGlossaryEntryDto } from "@conductor/contracts";

import { sortGlossaryEntries, sortLessonLinks } from "./learner-lesson-types";
import styles from "./reading-lesson-view.module.css";

export function LessonResourcesPanel({
  lessonLinks,
  lessonGlossary
}: {
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
}): ReactElement | null {
  const sortedLessonLinks = sortLessonLinks(lessonLinks);
  const sortedGlossary = sortGlossaryEntries(lessonGlossary);
  const hasResourceLinks = sortedLessonLinks.length > 0;
  const hasGlossary = sortedGlossary.length > 0;
  if (!hasResourceLinks && !hasGlossary) {
    return null;
  }
  return (
    <section aria-labelledby="lesson-resources-heading">
      <h2 id="lesson-resources-heading" className={styles.resourcesHeading}>
        Resources
      </h2>
      {hasResourceLinks ? (
        <ul className={styles.resourceList}>
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
        <div className={hasResourceLinks ? styles.glossaryAfterLinks : undefined}>
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

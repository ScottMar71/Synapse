"use client";

import type { ReactElement } from "react";
import { useId, useState } from "react";

import type { CourseCopySuggestion, CourseCopyTone } from "./course-copy-wires";
import { suggestCourseCopy } from "./course-copy-wires";
import styles from "./course-wireframe.module.css";

type CourseCopyAssistantProps = {
  courseTitle: string;
  onApplyDescription: (value: string) => void;
  onApplyObjectives: (value: string) => void;
};

export function CourseCopyAssistant({
  courseTitle,
  onApplyDescription,
  onApplyObjectives
}: CourseCopyAssistantProps): ReactElement {
  const baseId = useId();
  const notesId = `${baseId}-notes`;
  const toneId = `${baseId}-tone`;

  const [authorNotes, setAuthorNotes] = useState("");
  const [tone, setTone] = useState<CourseCopyTone>("professional");
  const [suggestion, setSuggestion] = useState<CourseCopySuggestion | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSuggest(): Promise<void> {
    setBusy(true);
    setSuggestion(null);
    await new Promise((r) => setTimeout(r, 320));
    setSuggestion(
      suggestCourseCopy({
        courseTitle,
        authorNotes,
        tone
      })
    );
    setBusy(false);
  }

  return (
    <div className={`${styles.panel} ${styles.aiPanel}`}>
      <h2 className={styles.panelTitle}>Dickens</h2>
      <p className={styles.aiPanelHint}>
        Dickens drafts a course description and learning objectives from the title plus optional notes.
        Wireframe output is template-based; production would call your AI service.
      </p>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={notesId}>
          Optional context for the draft
        </label>
        <textarea
          id={notesId}
          className={styles.textarea}
          rows={3}
          value={authorNotes}
          onChange={(e) => setAuthorNotes(e.target.value)}
          placeholder="Audience, prerequisites, topics to stress, or outcomes you want emphasized."
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={toneId}>
          Tone
        </label>
        <select
          id={toneId}
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={tone}
          onChange={(e) => setTone(e.target.value as CourseCopyTone)}
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
        </select>
      </div>
      <button
        type="button"
        className={styles.primaryBtn}
        disabled={busy}
        onClick={() => void handleSuggest()}
      >
        {busy ? "Drafting…" : "Suggest description & objectives"}
      </button>
      {suggestion ? (
        <div className={styles.suggestionBlock} aria-live="polite">
          <div className={styles.suggestionSection}>
            <span className={styles.suggestionLabel}>Suggested description</span>
            <p className={styles.suggestionText}>{suggestion.description}</p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onApplyDescription(suggestion.description)}
            >
              Use for description
            </button>
          </div>
          <div className={styles.suggestionSection}>
            <span className={styles.suggestionLabel}>Suggested learning objectives</span>
            <pre className={styles.suggestionPre}>{suggestion.objectives}</pre>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onApplyObjectives(suggestion.objectives)}
            >
              Use for objectives
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

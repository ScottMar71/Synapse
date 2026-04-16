"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  Input,
  QuizActionBar,
  QuizQuestionNav,
  QuizShell,
  QuizTimer,
} from "@conductor/ui";

const ATTEMPT_DURATION_SECONDS = 15 * 60;

type CourseAssessmentPanelProps = {
  assessmentId: string;
  onAssessmentIdChange: (value: string) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  assessmentMessage: string | null;
  assessmentBusy?: boolean;
};

export function CourseAssessmentPanel({
  assessmentId,
  onAssessmentIdChange,
  onSaveDraft,
  onSubmit,
  assessmentMessage,
  assessmentBusy = false,
}: CourseAssessmentPanelProps): ReactElement {
  const [secondsRemaining, setSecondsRemaining] = useState(ATTEMPT_DURATION_SECONDS);
  const [flagged, setFlagged] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  const validateAndRun = useCallback(
    (action: () => void) => {
      if (!assessmentId.trim()) {
        setValidationErrors(["Enter an assessment ID before saving or submitting."]);
        return;
      }
      setValidationErrors([]);
      action();
    },
    [assessmentId],
  );

  return (
    <QuizShell
      title="Assessment"
      description="Enter an assessment identifier from your tenant (for example from seed data) to exercise draft and submit flows."
      timer={<QuizTimer secondsRemaining={secondsRemaining} warnBelowSeconds={60} />}
      questionNav={
        <QuizQuestionNav
          currentIndex={1}
          total={1}
          flagged={flagged}
          onFlagToggle={() => {
            setFlagged((f) => !f);
          }}
        />
      }
      validationErrors={validationErrors}
      actions={
        <QuizActionBar
          onSaveDraft={() => {
            validateAndRun(onSaveDraft);
          }}
          onSubmit={() => {
            validateAndRun(onSubmit);
          }}
          busy={assessmentBusy}
        />
      }
      statusMessage={assessmentMessage}
    >
      <Input
        label="Assessment ID"
        hint="Used with the LMS submissions API for this demo flow."
        value={assessmentId}
        onChange={(e) => {
          setValidationErrors([]);
          onAssessmentIdChange(e.target.value);
        }}
        autoComplete="off"
        disabled={assessmentBusy}
      />
    </QuizShell>
  );
}

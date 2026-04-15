"use client";

import { useParams } from "next/navigation";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { fetchCourse, fetchProgress, postSubmitAssessment, putProgress, putSubmissionDraft } from "../../../../lib/lms-api-client";
import { getSession } from "../../../../lib/lms-session";

import { CourseAssessmentPanel } from "./course-assessment-panel";
import { CourseOutline } from "./course-outline";
import { CourseProgressPanel } from "./course-progress-panel";

type CourseViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; title: string; description: string | null; coursePercent: number | null };

export default function LearnerCoursePage(): ReactElement {
  const params = useParams();
  const courseId = typeof params.courseId === "string" ? params.courseId : "";

  const [state, setState] = useState<CourseViewState>({ status: "loading" });
  const [percentInput, setPercentInput] = useState("0");
  const [assessmentId, setAssessmentId] = useState("");
  const [assessmentMessage, setAssessmentMessage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) {
      setState({ status: "error", message: "Missing course." });
      return;
    }
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session." });
      return;
    }
    setState({ status: "loading" });
    const courseRes = await fetchCourse(session, courseId);
    if (!courseRes.ok) {
      setState({ status: "error", message: courseRes.error.message });
      return;
    }
    const progressRes = await fetchProgress(session, session.userId);
    if (!progressRes.ok) {
      setState({ status: "error", message: progressRes.error.message });
      return;
    }
    const courseRow = progressRes.progress.find((p) => p.courseId === courseId && p.scope === "COURSE");
    setPercentInput(String(courseRow?.percent ?? 0));
    setState({
      status: "ready",
      title: courseRes.course.title,
      description: courseRes.course.description,
      coursePercent: courseRow?.percent ?? null
    });
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProgress = useCallback(async () => {
    if (!courseId) return;
    const session = getSession();
    if (!session) return;
    const value = Number.parseInt(percentInput, 10);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setProgressMessage("Enter an integer from 0 to 100.");
      return;
    }
    setProgressMessage(null);
    const result = await putProgress(session, {
      userId: session.userId,
      courseId,
      scope: "COURSE",
      percent: value
    });
    if (!result.ok) {
      setProgressMessage(result.error.message);
      return;
    }
    setProgressMessage(`Saved progress at ${result.progress.percent}%.`);
    void load();
  }, [courseId, percentInput, load]);

  const saveDraft = useCallback(async () => {
    const session = getSession();
    if (!session || !assessmentId.trim()) return;
    setAssessmentMessage(null);
    const result = await putSubmissionDraft(session, assessmentId.trim());
    if (!result.ok) {
      setAssessmentMessage(result.error.message);
      return;
    }
    setAssessmentMessage(`Draft ready (${result.submission.status}).`);
  }, [assessmentId]);

  const submitAssessment = useCallback(async () => {
    const session = getSession();
    if (!session || !assessmentId.trim()) return;
    setAssessmentMessage(null);
    const result = await postSubmitAssessment(session, assessmentId.trim());
    if (!result.ok) {
      setAssessmentMessage(result.error.message);
      return;
    }
    setAssessmentMessage(`Submitted (${result.submission.status}).`);
  }, [assessmentId]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Loading course…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" style={{ padding: "var(--space-4)", background: "#fef2f2", borderRadius: "var(--radius-md)" }}>
        <p style={{ margin: 0 }}>{state.message}</p>
        <button
          type="button"
          onClick={() => {
            void load();
          }}
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <article aria-labelledby="course-title">
      <h2 id="course-title" style={{ marginTop: 0, fontSize: "1.25rem" }}>
        {state.title}
      </h2>
      {state.description ? (
        <p style={{ margin: "0 0 var(--space-6)", color: "var(--color-text-muted)" }}>{state.description}</p>
      ) : null}

      <CourseOutline />

      <CourseProgressPanel
        coursePercent={state.coursePercent}
        percentInput={percentInput}
        onPercentChange={setPercentInput}
        onSave={() => {
          void saveProgress();
        }}
        progressMessage={progressMessage}
      />

      <CourseAssessmentPanel
        assessmentId={assessmentId}
        onAssessmentIdChange={setAssessmentId}
        onSaveDraft={() => {
          void saveDraft();
        }}
        onSubmit={() => {
          void submitAssessment();
        }}
        assessmentMessage={assessmentMessage}
      />
    </article>
  );
}

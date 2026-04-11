"use client";

import { useCallback, useState } from "react";
import type { CSSProperties, ReactElement } from "react";

type Task = "translate" | "plain_language";

type ApiOkText = {
  task: Task;
  model: string;
  format: "text";
  text: string;
};

type ApiOkLessons = {
  task: Task;
  model: string;
  format: "lessons";
  lessons: Array<{ title: string; content?: string | null }>;
};

const panel: CSSProperties = {
  marginTop: "28px",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #d7e0ea",
  backgroundColor: "#f6f8fb",
  maxWidth: "820px"
};

const title: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1.15rem",
  color: "#0a2545"
};

const muted: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "0.9rem",
  color: "#526b86"
};

const label: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginBottom: "12px",
  fontSize: "0.85rem",
  color: "#304a66"
};

const inputBase: CSSProperties = {
  border: "1px solid #cad6e3",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  color: "#0a2545",
  width: "100%",
  boxSizing: "border-box"
};

const textarea: CSSProperties = {
  ...inputBase,
  minHeight: "140px",
  resize: "vertical" as const
};

const row: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
};

const button: CSSProperties = {
  marginTop: "12px",
  padding: "10px 18px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#0a2545",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem"
};

const error: CSSProperties = {
  color: "#a61b1b",
  fontSize: "0.9rem",
  marginTop: "10px"
};

const radioRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "12px",
  fontSize: "0.9rem",
  color: "#0a2545"
};

const COMMON_LANG = [
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese (Brazil)",
  "Japanese",
  "Korean",
  "Simplified Chinese",
  "Dutch",
  "Polish"
];

export function CourseAITranslator(): ReactElement {
  const [task, setTask] = useState<Task>("translate");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [sourceLanguageHint, setSourceLanguageHint] = useState("");
  const [audienceHint, setAudienceHint] = useState("");
  const [format, setFormat] = useState<"text" | "lessons">("text");
  const [text, setText] = useState(
    "<h2>Objectives</h2><ul><li>Map stakeholder interests</li><li>Draft a principled concession</li></ul><p>Use BATNA as a guardrail.</p>"
  );
  const [lessonTitle, setLessonTitle] = useState("Negotiation fundamentals");
  const [lessonBody, setLessonBody] = useState(
    "<p>Positions are what people say they want; interests are why they want them.</p>"
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [outText, setOutText] = useState<string | null>(null);
  const [outLessons, setOutLessons] = useState<ApiOkLessons["lessons"] | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setOutText(null);
    setOutLessons(null);

    const body =
      format === "text"
        ? {
            task,
            targetLanguage: task === "translate" ? targetLanguage : undefined,
            sourceLanguageHint: sourceLanguageHint.trim() || undefined,
            audienceHint: task === "plain_language" ? audienceHint.trim() || undefined : undefined,
            text
          }
        : {
            task,
            targetLanguage: task === "translate" ? targetLanguage : undefined,
            sourceLanguageHint: sourceLanguageHint.trim() || undefined,
            audienceHint: task === "plain_language" ? audienceHint.trim() || undefined : undefined,
            lessons: [{ title: lessonTitle, content: lessonBody || null }]
          };

    try {
      const res = await fetch("/api/course-translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Request failed.";
        setErr(msg);
        return;
      }
      if (typeof data === "object" && data !== null && "format" in data) {
        if ((data as { format: string }).format === "text") {
          setOutText((data as ApiOkText).text);
        } else {
          setOutLessons((data as ApiOkLessons).lessons);
        }
      }
    } catch {
      setErr("Network error. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }, [audienceHint, format, lessonBody, lessonTitle, sourceLanguageHint, task, targetLanguage, text]);

  return (
    <section style={panel} aria-labelledby="course-translator-heading">
      <h2 id="course-translator-heading" style={title}>
        Course AI translator
      </h2>
      <p style={muted}>
        Send course HTML or text to another language, or rewrite in plain language for a chosen audience. Uses OpenAI on the
        server when <code style={{ fontSize: "0.8em" }}>OPENAI_API_KEY</code> is set (optional model{" "}
        <code style={{ fontSize: "0.8em" }}>COURSE_TRANSLATOR_OPENAI_MODEL</code>).
      </p>

      <div style={radioRow}>
        <label>
          <input type="radio" name="task" checked={task === "translate"} onChange={() => setTask("translate")} /> Translate
        </label>
        <label>
          <input type="radio" name="task" checked={task === "plain_language"} onChange={() => setTask("plain_language")} /> Plain
          language
        </label>
      </div>

      {task === "translate" ? (
        <div style={row}>
          <label style={label}>
            Target language
            <input
              style={inputBase}
              list="course-translate-langs"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            />
            <datalist id="course-translate-langs">
              {COMMON_LANG.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
          <label style={label}>
            Source language (optional hint)
            <input
              style={inputBase}
              placeholder="e.g. English — leave blank to auto-detect"
              value={sourceLanguageHint}
              onChange={(e) => setSourceLanguageHint(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <label style={label}>
          Audience hint (optional)
          <input
            style={inputBase}
            placeholder="e.g. retail store managers, new hires, executives"
            value={audienceHint}
            onChange={(e) => setAudienceHint(e.target.value)}
          />
        </label>
      )}

      <div style={radioRow}>
        <label>
          <input type="radio" name="fmt" checked={format === "text"} onChange={() => setFormat("text")} /> Single block
        </label>
        <label>
          <input type="radio" name="fmt" checked={format === "lessons"} onChange={() => setFormat("lessons")} /> One lesson
          (title + body)
        </label>
      </div>

      {format === "text" ? (
        <label style={label}>
          Course content
          <textarea style={textarea} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      ) : (
        <>
          <label style={label}>
            Lesson title
            <input style={inputBase} value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
          </label>
          <label style={label}>
            Lesson body (HTML or text)
            <textarea style={textarea} value={lessonBody} onChange={(e) => setLessonBody(e.target.value)} />
          </label>
        </>
      )}

      <button type="button" style={button} onClick={() => void run()} disabled={loading}>
        {loading ? "Working…" : task === "translate" ? "Translate" : "Rewrite"}
      </button>
      {err ? <p style={error}>{err}</p> : null}

      {outText ? (
        <label style={{ ...label, marginTop: "16px" }}>
          Result
          <textarea style={{ ...textarea, minHeight: "180px" }} readOnly value={outText} />
        </label>
      ) : null}

      {outLessons?.length ? (
        <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
          <span style={label}>Result</span>
          {outLessons.map((l, i) => (
            <div
              key={`${l.title}-${i}`}
              style={{ padding: "12px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #d7e0ea" }}
            >
              <strong style={{ color: "#0a2545" }}>{l.title}</strong>
              <textarea
                style={{ ...textarea, marginTop: "8px", minHeight: "120px" }}
                readOnly
                value={l.content ?? ""}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

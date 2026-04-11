"use client";

import { useCallback, useState } from "react";
import type { CSSProperties, ReactElement } from "react";

type ApiEstimate = {
  mode: string;
  totalMinutes: number;
  lowMinutes: number;
  highMinutes: number;
  weeksAtPace: number | null;
  lessonCount: number;
  wordCount: number;
  summary: string;
  assumptions: string[];
};

const panel: CSSProperties = {
  backgroundColor: "#f0f7f2",
  border: "1px solid #b8d4c4",
  borderRadius: "8px",
  display: "grid",
  gap: "10px",
  padding: "12px"
};

const title: CSSProperties = {
  fontSize: "15px",
  margin: 0,
  color: "#0a2545"
};

const label: CSSProperties = {
  display: "grid",
  gap: "4px",
  fontSize: "12px",
  color: "#304a66"
};

const textarea: CSSProperties = {
  border: "1px solid #cad6e3",
  borderRadius: "8px",
  color: "#0a2545",
  fontFamily: "inherit",
  fontSize: "13px",
  minHeight: "88px",
  padding: "8px",
  resize: "vertical" as const,
  width: "100%",
  boxSizing: "border-box"
};

const row: CSSProperties = {
  display: "grid",
  gap: "8px",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"
};

const select: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #cad6e3",
  borderRadius: "8px",
  color: "#304a66",
  fontSize: "13px",
  padding: "6px 10px",
  width: "100%"
};

const button: CSSProperties = {
  backgroundColor: "#0a2545",
  border: "none",
  borderRadius: "999px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
  padding: "8px 14px",
  width: "fit-content"
};

const errorText: CSSProperties = {
  color: "#a61b1b",
  fontSize: "13px",
  margin: 0
};

const muted: CSSProperties = {
  color: "#526b86",
  fontSize: "12px",
  margin: 0
};

const statsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px"
};

const chip: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #cad6e3",
  borderRadius: "999px",
  color: "#304a66",
  fontSize: "12px",
  padding: "4px 10px"
};

const list: CSSProperties = {
  margin: "4px 0 0",
  paddingLeft: "18px",
  color: "#304a66",
  fontSize: "13px"
};

function formatMinutes(n: number): string {
  if (n < 60) {
    return `${n} min`;
  }
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function LearningTimeAssistant(): ReactElement {
  const [context, setContext] = useState(
    "Learn negotiation basics: interests vs positions, anchoring, and closing. One short role-play per week."
  );
  const [minutesPerWeek, setMinutesPerWeek] = useState("120");
  const [experience, setExperience] = useState<"new" | "familiar" | "expert">("familiar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiEstimate | null>(null);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pace = Number.parseInt(minutesPerWeek, 10);
      const res = await fetch("/api/learning-time-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          context,
          minutesPerWeek: Number.isFinite(pace) && pace >= 30 ? pace : undefined,
          experience
        })
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not estimate time.";
        setError(message);
        setResult(null);
        return;
      }
      setResult(data as ApiEstimate);
    } catch {
      setError("Network error. Try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [context, experience, minutesPerWeek]);

  return (
    <div style={panel}>
      <h3 style={title}>AI time-to-complete assistant</h3>
      <p style={muted}>
        Describe what you want to learn (or paste an outline). We combine a transparent heuristic with optional OpenAI wording when{" "}
        <code style={{ fontSize: "11px" }}>OPENAI_API_KEY</code> is set on the server.
      </p>
      <label style={label}>
        Your learning goal or outline
        <textarea style={textarea} value={context} onChange={(e) => setContext(e.target.value)} />
      </label>
      <div style={row}>
        <label style={label}>
          Minutes per week (optional)
          <input
            type="number"
            min={30}
            style={{ ...select, fontFamily: "inherit" }}
            value={minutesPerWeek}
            onChange={(e) => setMinutesPerWeek(e.target.value)}
          />
        </label>
        <label style={label}>
          Experience with the topic
          <select style={select} value={experience} onChange={(e) => setExperience(e.target.value as typeof experience)}>
            <option value="new">Mostly new to me</option>
            <option value="familiar">Some prior exposure</option>
            <option value="expert">Very familiar / refresh</option>
          </select>
        </label>
      </div>
      <button type="button" style={button} onClick={() => void onSubmit()} disabled={loading}>
        {loading ? "Estimating…" : "Estimate time to complete"}
      </button>
      {error ? <p style={errorText}>{error}</p> : null}
      {result ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={statsRow}>
            <span style={chip}>Point estimate: {formatMinutes(result.totalMinutes)}</span>
            <span style={chip}>
              Range: {formatMinutes(result.lowMinutes)} – {formatMinutes(result.highMinutes)}
            </span>
            {result.weeksAtPace != null ? (
              <span style={chip}>~{result.weeksAtPace} weeks at your weekly pace</span>
            ) : null}
            <span style={chip}>Mode: {result.mode === "ai_enhanced" ? "AI-enhanced copy" : "Heuristic"}</span>
          </div>
          <p style={{ ...muted, fontSize: "13px", color: "#0a2545" }}>{result.summary}</p>
          <p style={{ ...muted, marginBottom: 0 }}>Assumptions</p>
          <ul style={list}>
            {result.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

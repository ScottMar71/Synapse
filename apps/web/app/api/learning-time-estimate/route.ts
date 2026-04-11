import { z } from "zod";

import {
  buildFallbackCopy,
  estimateLearningMinutes,
  type EstimateInput,
  type EstimateResult
} from "../../../lib/learning-time-estimate";

export const runtime = "nodejs";

const lessonSchema = z.object({
  title: z.string().min(1).max(400),
  content: z.string().max(120_000).optional().nullable()
});

const bodySchema = z
  .object({
    context: z.string().max(12_000).default(""),
    lessons: z.array(lessonSchema).max(250).optional(),
    minutesPerWeek: z.number().finite().min(30).max(10_080).optional(),
    experience: z.enum(["new", "familiar", "expert"]).optional()
  })
  .superRefine((data, ctx) => {
    const hasLessons = (data.lessons?.length ?? 0) > 0;
    if (!hasLessons && data.context.trim().length < 24) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide either a longer learning goal description (24+ characters) or at least one lesson with a title."
      });
    }
  });

const aiShape = z.object({
  summary: z.string().min(1).max(4000),
  assumptions: z.array(z.string().min(1).max(500)).min(2).max(8)
});

async function enhanceWithOpenAI(
  input: EstimateInput,
  stats: EstimateResult
): Promise<{ summary: string; assumptions: string[] } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const payload = {
    model: process.env.LEARNING_TIME_OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    response_format: { type: "json_object" as const },
    messages: [
      {
        role: "system" as const,
        content:
          "You explain learning time estimates for adult self-paced study. You receive fixed numeric totals from a deterministic estimator — do not change those numbers. Reply as JSON with keys summary (2–4 sentences, plain language) and assumptions (3–6 short strings). Acknowledge uncertainty. Never mention token limits."
      },
      {
        role: "user" as const,
        content: JSON.stringify({
          learnerContext: input.context.slice(0, 6000),
          experience: input.experience ?? "familiar",
          minutesPerWeek: input.minutesPerWeek ?? null,
          stats: {
            totalMinutes: stats.totalMinutes,
            lowMinutes: stats.lowMinutes,
            highMinutes: stats.highMinutes,
            weeksAtPace: stats.weeksAtPace,
            lessonCount: stats.lessonCount,
            wordCount: stats.wordCount
          }
        })
      }
    ]
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return null;
  }

  const raw: unknown = await response.json();
  const content =
    typeof raw === "object" &&
    raw !== null &&
    "choices" in raw &&
    Array.isArray((raw as { choices: unknown }).choices) &&
    (raw as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]
      ?.message?.content;

  if (typeof content !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    const shaped = aiShape.safeParse(parsed);
    if (!shaped.success) {
      return null;
    }
    return shaped.data;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(" ");
    return Response.json({ error: message || "Invalid request" }, { status: 400 });
  }

  const input: EstimateInput = {
    context: parsed.data.context.trim(),
    lessons: parsed.data.lessons,
    minutesPerWeek: parsed.data.minutesPerWeek,
    experience: parsed.data.experience
  };

  const stats = estimateLearningMinutes(input);
  const ai = await enhanceWithOpenAI(input, stats);
  const fallback = buildFallbackCopy(input, stats);
  const summary = ai?.summary ?? fallback.summary;
  const assumptions = ai?.assumptions ?? fallback.assumptions;
  const mode = ai ? "ai_enhanced" : "heuristic";

  return Response.json({
    mode,
    totalMinutes: stats.totalMinutes,
    lowMinutes: stats.lowMinutes,
    highMinutes: stats.highMinutes,
    weeksAtPace: stats.weeksAtPace,
    lessonCount: stats.lessonCount,
    wordCount: stats.wordCount,
    summary,
    assumptions
  });
}

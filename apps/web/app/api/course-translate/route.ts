import { z } from "zod";

export const runtime = "nodejs";

const MAX_CHARS = 48_000;

const lessonSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(100_000).optional().nullable()
});

const bodySchema = z
  .object({
    task: z.enum(["translate", "plain_language"]),
    targetLanguage: z.string().max(120).optional(),
    sourceLanguageHint: z.string().max(120).optional(),
    audienceHint: z.string().max(240).optional(),
    text: z.string().max(100_000).optional(),
    lessons: z.array(lessonSchema).max(80).optional()
  })
  .superRefine((data, ctx) => {
    if (data.task === "translate" && !(data.targetLanguage?.trim())) {
      ctx.addIssue({
        code: "custom",
        path: ["targetLanguage"],
        message: "Target language is required for translation."
      });
    }
    const textLen = data.text?.trim().length ?? 0;
    const lessonCount = data.lessons?.length ?? 0;
    if (textLen === 0 && lessonCount === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Provide non-empty text or at least one lesson with a title."
      });
    }
    if (textLen > 0 && lessonCount > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Send either text or lessons, not both."
      });
    }
  });

const textResponseSchema = z.object({
  text: z.string().min(1).max(200_000)
});

const lessonsResponseSchema = z.object({
  lessons: z.array(
    z.object({
      title: z.string().min(1).max(500),
      content: z.string().max(100_000).nullable().optional()
    })
  )
});

function countChars(input: z.infer<typeof bodySchema>): number {
  if (input.text?.trim()) {
    return input.text.length;
  }
  let n = 0;
  for (const l of input.lessons ?? []) {
    n += l.title.length + (l.content?.length ?? 0);
  }
  return n;
}

function buildSystemPrompt(input: z.infer<typeof bodySchema>): string {
  if (input.task === "plain_language") {
    const audience = input.audienceHint?.trim() || "busy professionals who are not subject-matter experts";
    return [
      "You rewrite LMS course material for clarity while keeping instructional intent.",
      `Audience: ${audience}.`,
      "Preserve lists, headings, and simple HTML or Markdown structure when the source uses them.",
      "Reply with JSON only, no markdown fences, matching the requested response shape exactly."
    ].join(" ");
  }

  const source = input.sourceLanguageHint?.trim() || "the source language of the text";
  const target = input.targetLanguage?.trim() ?? "";
  return [
    "You translate LMS course content for learners.",
    `Translate from ${source} into ${target}.`,
    "Keep tone clear and pedagogical. Preserve lists, headings, and simple HTML or Markdown structure when present.",
    "Do not add commentary outside the translated material.",
    "Reply with JSON only, no markdown fences, matching the requested response shape exactly."
  ].join(" ");
}

function buildUserPayload(input: z.infer<typeof bodySchema>): string {
  if (input.text?.trim()) {
    return JSON.stringify({
      shape: "Return a JSON object with a single string field \"text\" containing the full result.",
      task: input.task,
      targetLanguage: input.targetLanguage ?? null,
      audienceHint: input.audienceHint ?? null,
      source: { format: "text", text: input.text }
    });
  }
  return JSON.stringify({
    shape:
      'Return a JSON object { "lessons": [ { "title": string, "content": string | null } ] } with the same number of lessons in the same order.',
    task: input.task,
    targetLanguage: input.targetLanguage ?? null,
    audienceHint: input.audienceHint ?? null,
    source: { format: "lessons", lessons: input.lessons }
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Course translation requires OPENAI_API_KEY on the server. Add it to your environment and restart the dev server."
      },
      { status: 503 }
    );
  }

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

  const input = parsed.data;
  const chars = countChars(input);
  if (chars > MAX_CHARS) {
    return Response.json(
      { error: `Input is too long (${chars} characters). Maximum is ${MAX_CHARS} characters per request.` },
      { status: 400 }
    );
  }

  const model = process.env.COURSE_TRANSLATOR_OPENAI_MODEL ?? "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system" as const, content: buildSystemPrompt(input) },
      { role: "user" as const, content: buildUserPayload(input) }
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
    const errText = await response.text();
    return Response.json(
      { error: "Translation service returned an error.", detail: errText.slice(0, 500) },
      { status: 502 }
    );
  }

  const raw: unknown = await response.json();
  const content =
    typeof raw === "object" &&
    raw !== null &&
    "choices" in raw &&
    Array.isArray((raw as { choices: unknown }).choices) &&
    (raw as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]?.message?.content;

  if (typeof content !== "string") {
    return Response.json({ error: "Unexpected response from translation service." }, { status: 502 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    return Response.json({ error: "Model returned invalid JSON." }, { status: 502 });
  }

  if (input.text?.trim()) {
    const textParsed = textResponseSchema.safeParse(parsedJson);
    if (!textParsed.success) {
      return Response.json({ error: "Model output did not match the expected text shape." }, { status: 502 });
    }
    return Response.json({
      task: input.task,
      model,
      format: "text" as const,
      text: textParsed.data.text
    });
  }

  const lessonsParsed = lessonsResponseSchema.safeParse(parsedJson);
  if (!lessonsParsed.success) {
    return Response.json({ error: "Model output did not match the expected lessons shape." }, { status: 502 });
  }

  const expected = input.lessons?.length ?? 0;
  if (lessonsParsed.data.lessons.length !== expected) {
    return Response.json(
      {
        error: `Expected ${expected} lessons in the response, got ${lessonsParsed.data.lessons.length}. Try again or shorten the batch.`
      },
      { status: 502 }
    );
  }

  return Response.json({
    task: input.task,
    model,
    format: "lessons" as const,
    lessons: lessonsParsed.data.lessons
  });
}

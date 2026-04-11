export type CourseCopyTone = "professional" | "friendly" | "formal";

export type CourseCopySuggestion = {
  description: string;
  objectives: string;
};

function tonePhrase(tone: CourseCopyTone): string {
  switch (tone) {
    case "friendly":
      return "friendly pacing, plain language, and quick wins";
    case "formal":
      return "structured progression, precise terminology, and measurable checkpoints";
    default:
      return "clear explanations, realistic examples, and practice that maps to on-the-job tasks";
  }
}

/**
 * Deterministic copy used for the admin course editor wireframe.
 * A production build would replace this with a model-backed API.
 */
export function suggestCourseCopy(input: {
  courseTitle: string;
  authorNotes: string;
  tone: CourseCopyTone;
  /** Rotates phrasing for “alternative wording” in the wireframe. */
  variant?: number;
}): CourseCopySuggestion {
  const title = input.courseTitle.trim() || "This course";
  const notes = input.authorNotes.trim();
  const focus =
    notes ||
    "the skills and decisions learners need to perform confidently after they finish";

  const clip = (value: string, max: number): string =>
    value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

  const variantSlot = Math.abs(Math.floor(input.variant ?? 0)) % 3;

  const descriptionBySlot: [string, string, string] = [
    [
      `${title} introduces learners to ${focus}.`,
      `The experience favors ${tonePhrase(input.tone)}.`,
      notes
        ? `Author notes are woven in so the narrative stays anchored to your intent.`
        : `Authors can refine this draft with audience-specific notes before publishing.`
    ].join(" "),
    [
      `Learners in ${title} work through ${focus} with steady support.`,
      `Sessions lean on ${tonePhrase(input.tone)} so the catalog copy reads true to the live course.`,
      notes
        ? `Your notes steer examples and emphasis without crowding the page.`
        : `Add audience notes when you have them so the description matches who actually takes the course.`
    ].join(" "),
    [
      `${title} is framed around ${focus}, with outcomes learners can recognize quickly.`,
      `Tone and pacing follow ${tonePhrase(input.tone)}.`,
      notes
        ? `The draft mirrors the priorities you called out in the notes field.`
        : `This baseline stands on the title alone; optional notes sharpen the story further.`
    ].join(" ")
  ];

  const objectivesLinesBySlot: [string[], string[], string[]] = [
    notes
      ? [
          `Explain how ${title} supports: ${clip(notes, 120)}`,
          `Apply those priorities through the practice activities without needing external references.`,
          `Demonstrate readiness by completing the checkpoints and reflecting on gaps.`
        ]
      : [
          `Summarize what ${title} covers and why it matters for the intended audience.`,
          `Complete practice activities that mirror common situations after the training.`,
          `Self-check understanding using the built-in checkpoints before marking the course complete.`
        ],
    notes
      ? [
          `Describe how ${title} turns “${clip(notes, 100)}” into concrete practice.`,
          `Use the activities to rehearse decisions and trade-offs tied to that focus.`,
          `Close gaps by revisiting checkpoints until the objectives feel owned, not memorized.`
        ]
      : [
          `Orient new learners to what ${title} promises and how progress is measured.`,
          `Translate lessons into repeatable behaviors through guided practice blocks.`,
          `Confirm mastery with checkpoints before moving on or publishing updates.`
        ],
    notes
      ? [
          `Connect ${title} to the outcomes implied by: ${clip(notes, 120)}`,
          `Prioritize scenarios that surface judgment calls, not just recall.`,
          `Finish with evidence from checkpoints plus a short reflection on remaining risks.`
        ]
      : [
          `State the value proposition of ${title} in language the catalog audience expects.`,
          `Sequence practice so each block reinforces the prior one without redundancy.`,
          `Leave the course only after checkpoints show consistent performance, not one-off luck.`
        ]
  ];

  return {
    description: descriptionBySlot[variantSlot],
    objectives: objectivesLinesBySlot[variantSlot].join("\n")
  };
}

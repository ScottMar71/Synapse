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
}): CourseCopySuggestion {
  const title = input.courseTitle.trim() || "This course";
  const notes = input.authorNotes.trim();
  const focus =
    notes ||
    "the skills and decisions learners need to perform confidently after they finish";

  const description = [
    `${title} introduces learners to ${focus}.`,
    `The experience favors ${tonePhrase(input.tone)}.`,
    notes
      ? `Author notes are woven in so the narrative stays anchored to your intent.`
      : `Authors can refine this draft with audience-specific notes before publishing.`
  ].join(" ");

  const clip = (value: string, max: number): string =>
    value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

  const objectivesLines = notes
    ? [
        `Explain how ${title} supports: ${clip(notes, 120)}`,
        `Apply those priorities through the practice activities without needing external references.`,
        `Demonstrate readiness by completing the checkpoints and reflecting on gaps.`
      ]
    : [
        `Summarize what ${title} covers and why it matters for the intended audience.`,
        `Complete practice activities that mirror common situations after the training.`,
        `Self-check understanding using the built-in checkpoints before marking the course complete.`
      ];

  return { description, objectives: objectivesLines.join("\n") };
}

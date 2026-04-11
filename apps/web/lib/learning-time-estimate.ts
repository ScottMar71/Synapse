export type ExperienceLevel = "new" | "familiar" | "expert";

export type LessonInput = {
  title: string;
  content?: string | null;
};

export type EstimateInput = {
  context: string;
  lessons?: LessonInput[];
  minutesPerWeek?: number;
  experience?: ExperienceLevel;
};

export type EstimateResult = {
  totalMinutes: number;
  lowMinutes: number;
  highMinutes: number;
  weeksAtPace: number | null;
  lessonCount: number;
  wordCount: number;
};

const EXPERIENCE_MULTIPLIER: Record<ExperienceLevel, number> = {
  new: 1.28,
  familiar: 1,
  expert: 0.82
};

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function countWords(text: string): number {
  const normalized = stripHtml(text).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return 0;
  }
  return normalized.split(" ").length;
}

function experienceMultiplier(level: ExperienceLevel | undefined): number {
  if (!level) {
    return 1;
  }
  return EXPERIENCE_MULTIPLIER[level];
}

/**
 * Heuristic time-to-complete in minutes from outline text and optional lesson bodies.
 * Tuned for self-paced reading plus light practice, not formal classroom hours.
 */
export function estimateLearningMinutes(input: EstimateInput): EstimateResult {
  const exp = experienceMultiplier(input.experience);
  const lessons = input.lessons ?? [];
  let wordCount = countWords(input.context);

  let rawMinutes = 0;

  if (lessons.length > 0) {
    for (const lesson of lessons) {
      const titleWords = countWords(lesson.title);
      const bodyWords = lesson.content ? countWords(lesson.content) : 0;
      wordCount += titleWords + bodyWords;

      const readingMinutes = bodyWords > 0 ? Math.max(5, bodyWords / 200) : 0;
      const structureMinutes = 8;
      const practiceMinutes = bodyWords > 0 ? Math.min(45, 6 + bodyWords / 400) : 18;
      rawMinutes += structureMinutes + readingMinutes + practiceMinutes;
    }
  } else {
    const contextWords = countWords(input.context);
    wordCount = contextWords;
    const synthesisMinutes = Math.max(45, 35 + contextWords / 12);
    rawMinutes = synthesisMinutes;
  }

  const totalMinutes = Math.round(rawMinutes * exp);
  const lowMinutes = Math.max(15, Math.round(totalMinutes * 0.72));
  const highMinutes = Math.round(totalMinutes * 1.38);

  const pace = input.minutesPerWeek;
  const weeksAtPace =
    pace && pace > 0 ? Math.round((totalMinutes / pace) * 10) / 10 : null;

  return {
    totalMinutes,
    lowMinutes,
    highMinutes,
    weeksAtPace,
    lessonCount: lessons.length,
    wordCount
  };
}

export function formatMinutesHuman(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${hours}h ${mins}m`;
}

export function buildFallbackCopy(input: EstimateInput, stats: EstimateResult): {
  summary: string;
  assumptions: string[];
} {
  const human = formatMinutesHuman(stats.totalMinutes);
  const range = `${formatMinutesHuman(stats.lowMinutes)} – ${formatMinutesHuman(stats.highMinutes)}`;
  const paceNote =
    stats.weeksAtPace != null && input.minutesPerWeek
      ? ` At ${input.minutesPerWeek} minutes per week, that is about ${stats.weeksAtPace} week${
          stats.weeksAtPace === 1 ? "" : "s"
        } of calendar time if you stay consistent.`
      : "";

  const summary =
    stats.lessonCount > 0
      ? `Across ${stats.lessonCount} lesson${stats.lessonCount === 1 ? "" : "s"} and roughly ${stats.wordCount.toLocaleString()} words counted from titles and content, focused self-paced work is likely around ${human} (rough range ${range}).${paceNote}`
      : `From your description (${stats.wordCount.toLocaleString()} words), expect on the order of ${human} of structured self-study (rough range ${range}).${paceNote}`;

  const assumptions = [
    "Includes reading, short reflection, and light practice—not formal instructor-led hours.",
    "Assumes you already have the materials; searching for resources would add time.",
    stats.lessonCount > 0
      ? "Long videos, labs, or proctored exams would push the upper end of the range."
      : "Breaking work into concrete lessons would narrow this estimate.",
    input.experience === "new"
      ? "Beginner multiplier applied for unfamiliar concepts."
      : input.experience === "expert"
        ? "Faster pace assumed because much of the vocabulary is already familiar."
        : "Mid-range pace assumes some prior exposure to the topic."
  ];

  return { summary, assumptions };
}

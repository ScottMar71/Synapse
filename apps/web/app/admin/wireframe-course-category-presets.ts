/**
 * Preset course categories for admin wireframes: the course editor “Course Categories”
 * metabox and the categories dashboard share this list so labels and ids stay aligned.
 */
export const WIREFRAME_PRESET_COURSE_CATEGORIES = [
  { id: "compliance", label: "Compliance" },
  { id: "onboarding", label: "Onboarding" },
  { id: "product", label: "Product training" },
  { id: "ideas", label: "Ideas" },
  { id: "leadership", label: "Leadership" },
  { id: "safety", label: "Safety" },
  { id: "sales", label: "Sales enablement" }
] as const;

export type WireframePresetCourseCategoryId = (typeof WIREFRAME_PRESET_COURSE_CATEGORIES)[number]["id"];

/** Subset and order for the “Most Used” tab in the course editor wireframe. */
export const WIREFRAME_MOST_USED_CATEGORY_IDS: readonly WireframePresetCourseCategoryId[] = [
  "compliance",
  "onboarding",
  "safety",
  "ideas"
];

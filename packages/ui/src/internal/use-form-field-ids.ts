import { useId } from "react";

export type FormFieldIds = {
  controlId: string;
  hintId: string;
  errorId: string;
};

/**
 * Stable ids for label / hint / error wiring (`aria-describedby`, `aria-invalid`).
 */
export function useFormFieldIds(forcedId?: string): FormFieldIds {
  const uid = useId();
  const base = forcedId ?? `fld-${uid}`;
  return {
    controlId: base,
    hintId: `${base}-hint`,
    errorId: `${base}-err`,
  };
}

export function describedByIds(ids: FormFieldIds, hasHint: boolean, hasError: boolean): string | undefined {
  const parts: string[] = [];
  if (hasHint) {
    parts.push(ids.hintId);
  }
  if (hasError) {
    parts.push(ids.errorId);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

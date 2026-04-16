/** Matches focusable elements for dialog/drawer tab traps (native controls + positive tabindex). */
export const OVERLAY_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

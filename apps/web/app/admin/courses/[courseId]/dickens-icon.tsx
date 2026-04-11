import type { ReactElement } from "react";

type DickensIconProps = {
  className?: string;
};

/** Quill-and-ink mark for the Dickens catalog-copy assistant. */
export function DickensIcon({ className }: DickensIconProps): ReactElement {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <path
        d="M20.5 2.5S18 5 13.5 11 7.5 18.5 5 20.5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 5.5S14.5 9 10 14 6 17.5 4.5 19"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity={0.55}
      />
      <path
        d="M12 9.5c2-1.6 4.5-4 8-8"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity={0.45}
      />
      <path
        d="M4 20.5 2.5 22M5.5 22 3 19.5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <ellipse cx="6.2" cy="19.8" rx="2.1" ry="1.15" fill="currentColor" opacity={0.22} />
    </svg>
  );
}

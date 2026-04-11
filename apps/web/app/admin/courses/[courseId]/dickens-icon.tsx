import type { ReactElement } from "react";

type DickensIconProps = {
  className?: string;
};

/** Feather quill mark for the Dickens panel. */
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
        fill="currentColor"
        d="M19.5 3.25C21 4.75 20.75 8.25 18.25 12.25 15 17.25 9.25 20.75 5.25 21.75L3.85 22.35 5.5 20.35C10.1 18 14.85 14.15 17.2 9.85 18.65 7.35 19.2 5.15 19.5 3.25Z"
      />
      <path
        d="M17.6 6.4C14.5 10 10.2 14.8 6.1 19.2"
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
      <path
        d="M15.4 8.2 13.1 10M13.2 11.4l-2.1 1.9M11 14.2 9 16.1"
        stroke="currentColor"
        strokeOpacity={0.32}
        strokeWidth={0.9}
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { ReactElement } from "react";

type DickensIconProps = {
  className?: string;
};

/** Victorian pen and folded paper for the Dickens panel. */
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
        fillOpacity={0.12}
        stroke="currentColor"
        strokeWidth={0.9}
        strokeLinejoin="round"
        d="M3.75 10.75h8.25l3.75 3.75v7.25H3.75v-11z"
      />
      <path
        d="M12 10.75v3.75h3.75"
        stroke="currentColor"
        strokeOpacity={0.34}
        strokeWidth={0.65}
        strokeLinejoin="round"
      />
      <path
        d="M5.25 14.25h7.25M5.25 16.5h7.25M5.25 18.75h5.25"
        stroke="currentColor"
        strokeOpacity={0.36}
        strokeWidth={0.7}
        strokeLinecap="round"
      />
      <path
        fill="currentColor"
        d="M20.65 3.35L22 4.75 11.85 15.35 10.35 14.05 20.65 3.35z"
      />
      <path
        d="M10.5 14.15L12.1 15.65"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={0.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { ReactElement, ReactNode } from "react";

import { LmsInstructorShell } from "./lms-instructor-shell";

type InstructorLayoutProps = {
  children: ReactNode;
};

export default function InstructorLayout({ children }: InstructorLayoutProps): ReactElement {
  return <LmsInstructorShell>{children}</LmsInstructorShell>;
}

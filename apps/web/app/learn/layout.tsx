import type { ReactElement, ReactNode } from "react";

import { LmsLearnerShell } from "./lms-learner-shell";

type LearnLayoutProps = {
  children: ReactNode;
};

export default function LearnLayout({ children }: LearnLayoutProps): ReactElement {
  return <LmsLearnerShell>{children}</LmsLearnerShell>;
}

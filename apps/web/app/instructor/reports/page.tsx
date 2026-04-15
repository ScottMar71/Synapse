import type { ReactElement } from "react";

import { ProgressReportsClient } from "./progress-reports-client";

export default function InstructorProgressReportsPage(): ReactElement {
  return <ProgressReportsClient variant="instructor" />;
}

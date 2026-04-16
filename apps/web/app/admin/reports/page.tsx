import type { ReactElement } from "react";

import { ProgressReportsClient } from "../../instructor/reports/progress-reports-client";

export default function AdminProgressReportsPage(): ReactElement {
  return (
    <div className="page-container">
      <ProgressReportsClient variant="admin" />
    </div>
  );
}

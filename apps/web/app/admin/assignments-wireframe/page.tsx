import type { ReactElement } from "react";

import { AssignmentsWireframeDashboard } from "./assignments-wireframe-dashboard";

type AssignmentsWireframePageProps = {
  searchParams: Promise<{ courseId?: string; learnerId?: string }>;
};

export default async function AssignmentsWireframePage({
  searchParams
}: AssignmentsWireframePageProps): Promise<ReactElement> {
  const sp = await searchParams;
  return (
    <AssignmentsWireframeDashboard
      initialCourseFilter={typeof sp.courseId === "string" ? sp.courseId : ""}
      initialLearnerFilter={typeof sp.learnerId === "string" ? sp.learnerId : ""}
    />
  );
}

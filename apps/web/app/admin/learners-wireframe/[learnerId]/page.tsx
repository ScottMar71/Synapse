import type { ReactElement } from "react";
import { notFound } from "next/navigation";

import { getDemoLearner } from "../demo-learners";
import { LearnerProfileWireframe } from "./learner-profile-wireframe";

type LearnerProfilePageProps = {
  params: Promise<{ learnerId: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function LearnerProfilePage({
  params,
  searchParams
}: LearnerProfilePageProps): Promise<ReactElement> {
  const { learnerId } = await params;
  const { edit } = await searchParams;
  const learner = getDemoLearner(learnerId);
  if (!learner) {
    notFound();
  }

  return <LearnerProfileWireframe learner={learner} initialEdit={edit === "1"} />;
}

import type { ReactElement } from "react";

import type { LmsPlatformContract } from "@conductor/contracts";

import { CourseAITranslator } from "../components/CourseAITranslator";

const runtimeContract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

export default function HomePage(): ReactElement {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Synapse LMS</h1>
      <p>API base: {runtimeContract.apiBasePath}</p>
      <p>Protected path: /protected</p>
      <CourseAITranslator />
    </main>
  );
}

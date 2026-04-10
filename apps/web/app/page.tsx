import type { ReactElement } from "react";

import type { LmsPlatformContract } from "@conductor/contracts";

const runtimeContract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

export default function HomePage(): ReactElement {
  return (
    <main>
      <h1>Synapse LMS</h1>
      <p>API base: {runtimeContract.apiBasePath}</p>
    </main>
  );
}

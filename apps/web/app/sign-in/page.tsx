import type { ReactElement } from "react";
import { Suspense } from "react";

import { SignInForm } from "./sign-in-form";

export default function SignInPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="page-container">
          <p role="status" style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Loading…
          </p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

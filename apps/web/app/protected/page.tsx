import type { ReactElement } from "react";

export default function ProtectedPage(): ReactElement {
  return (
    <main>
      <h1>Protected LMS Area</h1>
      <p>Only authenticated tenant members should reach this route.</p>
    </main>
  );
}

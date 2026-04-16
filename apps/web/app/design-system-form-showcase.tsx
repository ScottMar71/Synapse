"use client";

import {
  Checkbox,
  FileUpload,
  Input,
  PasswordInput,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Textarea,
  type FileListItem,
} from "@conductor/ui";
import type { ReactElement } from "react";
import { useState } from "react";

export function DesignSystemFormShowcase(): ReactElement {
  const [radio, setRadio] = useState("a");
  const [sw, setSw] = useState(false);
  const [files, setFiles] = useState<FileListItem[]>([]);

  return (
    <section style={{ marginTop: "var(--space-4)" }}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 var(--space-3)" }}>Form primitives (demo)</h2>
      <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
        Error and disabled examples for design-system review; sourced from <code>@conductor/ui</code>.
      </p>
      <div style={{ maxWidth: "36rem", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <Input label="Field with error" hint="Hint text." error="This field has an error." defaultValue="" />
        <Input label="Disabled field" hint="Not editable." disabled defaultValue="Read-only value" />
        <PasswordInput label="Password" showPasswordToggle hint="Client-only visibility toggle." />
        <Textarea label="Notes" hint="Min height 96px." rows={4} defaultValue="" />
        <Select label="Native select" hint="Prefer native for mobile.">
          <option value="">Choose…</option>
          <option value="1">One</option>
          <option value="2">Two</option>
        </Select>
        <Checkbox label="Accept terms" hint="Touch-friendly row height." />
        <RadioGroup
          name="demo"
          legend="Choose one"
          value={radio}
          onChange={setRadio}
          hint="Uses fieldset + legend per spec."
          error="Example group-level error message."
        >
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroup>
        <Switch label="Enable feature" checked={sw} onCheckedChange={setSw} hint="Immediate setting." />
        <Switch label="Locked" checked={false} onCheckedChange={() => {}} disabled hint="Disabled switch." />
        <FileUpload
          label="Attachments"
          hint="Drag files or use the button. Per-file errors can be passed via fileErrors or item.error."
          files={files}
          onFilesChange={setFiles}
          multiple
        />
      </div>
    </section>
  );
}

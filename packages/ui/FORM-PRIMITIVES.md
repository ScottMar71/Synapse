# Form primitives (`@conductor/ui`)

Implements **lms-design-system** §3.1 (Text input → File upload) and §4 interaction states.

## Components

| Component        | Role / notes |
|-----------------|--------------|
| `Input`         | Single-line text; `type` for email, search, number, password (or use `PasswordInput`). Label, optional hint and error; `aria-invalid`, `aria-describedby`. |
| `PasswordInput` | Client-only: password field with optional visibility toggle (`Button` tertiary). |
| `Textarea`      | `min-height: 96px`, `resize: vertical` (see CSS module). |
| `Select`        | Native `<select>` (preferred for mobile a11y). |
| `Checkbox`      | Touch-friendly row (`min-height: 44px`). Hint may precede the row. |
| `RadioGroup`    | `fieldset` + `legend`; pass `Radio` children with `value` / `label`. |
| `Switch`        | `<button role="switch">` with `aria-checked`. |
| `FileUpload`    | Client-only: hidden `<input type="file">`, drag-and-drop zone, `Button` trigger, optional per-file errors. |

## States (docs / review)

| State      | Visual (tokens) |
|-----------|------------------|
| Error     | `--color-status-error` on message; control `border-color` + `data-invalid`. |
| Disabled  | §4: `--color-bg-muted`, `--color-border-default`, reduced opacity, no pointer. |
| Read-only | `readOnly` on input/textarea: muted surface (not the same as disabled). |
| Focus     | `--shadow-focus` on `:focus-visible` for text controls. |

## Usage

Import from `@conductor/ui`. Ensure **`@conductor/design-tokens/tokens.css`** is loaded on the page (see `apps/web/app/globals.css`).

Example error + disabled:

```tsx
<Input label="Email" error="Enter a valid email." disabled />
<Switch label="Notifications" checked={false} onCheckedChange={() => {}} disabled hint="Unavailable in preview." />
```

Per-file errors with `FileUpload`: pass `fileErrors={{ "bad.pdf": "PDF only" }}` and/or `{ file, error }` on each `FileListItem`.

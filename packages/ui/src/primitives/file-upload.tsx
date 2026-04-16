"use client";

import type { ChangeEvent, DragEvent, InputHTMLAttributes, ReactNode } from "react";
import { useCallback, useId, useRef, useState } from "react";

import { Button } from "./button";
import { describedByIds, useFormFieldIds } from "../internal/use-form-field-ids";
import controlStyles from "./forms-controls.module.css";
import styles from "./forms-widgets.module.css";

export type FileListItem = {
  file: File;
  error?: string;
};

export type FileUploadProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "aria-describedby" | "aria-invalid" | "onChange" | "type" | "value"
> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  dropLabel?: ReactNode;
  chooseFilesLabel?: ReactNode;
  /** Per-file validation or upload errors keyed by file `name`. */
  fileErrors?: Record<string, string>;
  files: FileListItem[];
  onFilesChange: (items: FileListItem[]) => void;
};

export function FileUpload({
  label,
  hint,
  error,
  dropLabel = "Drag files here or choose from your device.",
  chooseFilesLabel = "Choose files",
  fileErrors,
  files,
  onFilesChange,
  id,
  disabled,
  multiple,
  accept,
  className,
  ...rest
}: FileUploadProps) {
  const ids = useFormFieldIds(id);
  const invalid = Boolean(error);
  const hasHint = Boolean(hint);
  const describe = describedByIds(ids, hasHint, invalid);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputUid = useId();

  const mergeFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = incoming instanceof FileList ? Array.from(incoming) : incoming;
      const mapped: FileListItem[] = list.map((file) => {
        const err = fileErrors?.[file.name];
        return err ? { file, error: err } : { file };
      });
      if (!multiple) {
        onFilesChange(mapped.slice(0, 1));
        return;
      }
      onFilesChange([...files, ...mapped]);
    },
    [files, fileErrors, multiple, onFilesChange],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      mergeFiles(e.target.files);
    }
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) {
      return;
    }
    if (e.dataTransfer.files?.length) {
      mergeFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={controlStyles.field}>
      <span className={controlStyles.label} id={`${ids.controlId}-label`}>
        {label}
      </span>
      {hasHint ? (
        <p id={ids.hintId} className={controlStyles.hint}>
          {hint}
        </p>
      ) : null}
      <div
        className={styles.fileDrop}
        data-drag={dragOver ? "true" : "false"}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          id={ids.controlId}
          className={styles.visuallyHidden}
          aria-invalid={invalid || undefined}
          aria-describedby={describe}
          aria-labelledby={`${ids.controlId}-label`}
          disabled={disabled}
          multiple={multiple}
          accept={accept}
          onChange={onInputChange}
          {...rest}
        />
        <p className={controlStyles.hint}>{dropLabel}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          id={`${inputUid}-choose`}
        >
          {chooseFilesLabel}
        </Button>
      </div>
      {files.length > 0 ? (
        <ul className={styles.fileList} aria-live="polite">
          {files.map((item) => {
            const err = item.error ?? fileErrors?.[item.file.name];
            return (
              <li key={`${item.file.name}-${item.file.size}-${item.file.lastModified}`} className={styles.fileRow}>
                <span className={styles.fileName}>{item.file.name}</span>
                {err ? (
                  <span className={styles.fileErr} role="alert">
                    {err}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {invalid ? (
        <p id={ids.errorId} role="alert" className={controlStyles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

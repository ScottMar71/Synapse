import type { SelectHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { describedByIds, useFormFieldIds } from "../internal/use-form-field-ids";
import { cx } from "../internal/cx";
import styles from "./forms-controls.module.css";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "aria-describedby" | "aria-invalid"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, disabled, required, children, ...rest },
  ref,
) {
  const ids = useFormFieldIds(id);
  const invalid = Boolean(error);
  const hasHint = Boolean(hint);
  const describe = describedByIds(ids, hasHint, invalid);

  return (
    <div className={styles.field}>
      <label htmlFor={ids.controlId} className={styles.label}>
        {label}
        {required ? (
          <span aria-hidden className={styles.requiredMark}>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {hasHint ? (
        <p id={ids.hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      <select
        ref={ref}
        id={ids.controlId}
        className={cx(styles.textControl, styles.selectControl, className)}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describe}
        aria-required={required || undefined}
        data-invalid={invalid ? "true" : undefined}
        {...rest}
      >
        {children}
      </select>
      {invalid ? (
        <p id={ids.errorId} role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

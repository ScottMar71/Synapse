import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { describedByIds, useFormFieldIds } from "../internal/use-form-field-ids";
import { cx } from "../internal/cx";
import controlStyles from "./forms-controls.module.css";
import styles from "./forms-widgets.module.css";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "aria-invalid" | "type"
> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, className, id, disabled, required, ...rest },
  ref,
) {
  const ids = useFormFieldIds(id);
  const invalid = Boolean(error);
  const hasHint = Boolean(hint);
  const describe = describedByIds(ids, hasHint, invalid);

  return (
    <div className={controlStyles.field}>
      {hasHint ? (
        <p id={ids.hintId} className={controlStyles.hint}>
          {hint}
        </p>
      ) : null}
      <div className={styles.choiceRow}>
        <input
          ref={ref}
          type="checkbox"
          id={ids.controlId}
          className={cx(styles.choiceInput, className)}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describe}
          aria-required={required || undefined}
          {...rest}
        />
        <label htmlFor={ids.controlId} className={styles.choiceLabel}>
          {label}
        </label>
      </div>
      {invalid ? (
        <p id={ids.errorId} role="alert" className={controlStyles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

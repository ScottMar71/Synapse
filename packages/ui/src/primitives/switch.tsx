import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { describedByIds, useFormFieldIds } from "../internal/use-form-field-ids";
import { cx } from "../internal/cx";
import controlStyles from "./forms-controls.module.css";
import styles from "./forms-widgets.module.css";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-checked" | "role" | "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { label, hint, error, checked, onCheckedChange, className, id, disabled, ...rest },
  ref,
) {
  const ids = useFormFieldIds(id);
  const invalid = Boolean(error);
  const hasHint = Boolean(hint);
  const describe = describedByIds(ids, hasHint, invalid);
  const labelId = `${ids.controlId}-switch-label`;

  return (
    <div className={controlStyles.field}>
      {hasHint ? (
        <p id={ids.hintId} className={controlStyles.hint}>
          {hint}
        </p>
      ) : null}
      <div className={styles.switchRow}>
        <span id={labelId} className={styles.switchLabel}>
          {label}
        </span>
        <button
          ref={ref}
          type="button"
          id={ids.controlId}
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          aria-invalid={invalid || undefined}
          aria-describedby={describe}
          disabled={disabled}
          data-on={checked ? "true" : "false"}
          className={cx(styles.switchTrack, className)}
          onClick={() => onCheckedChange(!checked)}
          {...rest}
        >
          <span className={styles.switchThumb} aria-hidden />
        </button>
      </div>
      {invalid ? (
        <p id={ids.errorId} role="alert" className={controlStyles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

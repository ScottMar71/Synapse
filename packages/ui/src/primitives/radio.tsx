"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useId, useMemo } from "react";

import { describedByIds, useFormFieldIds } from "../internal/use-form-field-ids";
import { cx } from "../internal/cx";
import controlStyles from "./forms-controls.module.css";
import styles from "./forms-widgets.module.css";

export type RadioGroupContextValue = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const RadioContext = createContext<RadioGroupContextValue | null>(null);

function useRadioContext(): RadioGroupContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) {
    throw new Error("Radio must be used inside RadioGroup");
  }
  return ctx;
}

export type RadioGroupProps = {
  name: string;
  legend: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function RadioGroup({ name, legend, value, onChange, disabled, hint, error, children }: RadioGroupProps) {
  const ids = useFormFieldIds();
  const invalid = Boolean(error);
  const hasHint = Boolean(hint);
  const describe = describedByIds(ids, hasHint, invalid);
  const ctx = useMemo<RadioGroupContextValue>(
    () => ({ name, value, onChange, disabled }),
    [name, value, onChange, disabled],
  );

  return (
    <fieldset
      className={styles.fieldset}
      aria-invalid={invalid || undefined}
      aria-describedby={describe}
      disabled={disabled}
    >
      <legend className={styles.legend}>{legend}</legend>
      {hasHint ? (
        <p id={ids.hintId} className={controlStyles.hint}>
          {hint}
        </p>
      ) : null}
      <RadioContext.Provider value={ctx}>
        <div className={styles.radioGroupInner}>{children}</div>
      </RadioContext.Provider>
      {invalid ? (
        <p id={ids.errorId} role="alert" className={controlStyles.errorText}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "checked" | "defaultChecked" | "name" | "onChange" | "type"
> & {
  value: string;
  label: ReactNode;
};

export function Radio({ value: optionValue, label, className, ...rest }: RadioProps) {
  const { name, value, onChange, disabled } = useRadioContext();
  const uid = useId();
  const inputId = `${uid}-opt-${String(optionValue).replace(/\W/g, "-")}`;

  return (
    <div className={styles.choiceRow}>
      <input
        type="radio"
        id={inputId}
        name={name}
        value={optionValue}
        checked={value === optionValue}
        onChange={() => onChange(optionValue)}
        disabled={disabled}
        className={cx(styles.choiceInput, className)}
        {...rest}
      />
      <label htmlFor={inputId} className={styles.choiceLabel}>
        {label}
      </label>
    </div>
  );
}

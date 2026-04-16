"use client";

import { useState } from "react";

import { Button } from "./button";
import { Input, type InputProps } from "./input";
import styles from "./forms-controls.module.css";

export type PasswordInputProps = Omit<InputProps, "type" | "endAdornment"> & {
  showPasswordToggle?: boolean;
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  showPasswordToggle = true,
  showLabel = "Show",
  hideLabel = "Hide",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  if (!showPasswordToggle) {
    return <Input type="password" autoComplete={props.autoComplete ?? "current-password"} {...props} />;
  }

  return (
    <Input
      type={visible ? "text" : "password"}
      autoComplete={props.autoComplete ?? "current-password"}
      {...props}
      endAdornment={
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          className={styles.passwordToggle}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? hideLabel : showLabel}
        </Button>
      }
    />
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cx } from "../internal/cx";
import styles from "./card.module.css";

export type CardVariant = "elevated" | "outlined" | "flat";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  interactive?: boolean;
  children: ReactNode;
};

const variantClass: Record<CardVariant, string> = {
  elevated: styles.elevated,
  outlined: styles.outlined,
  flat: styles.flat,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "elevated", interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        styles.card,
        variantClass[variant],
        interactive ? styles.interactive : undefined,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
};

export function CardHeader({ title, description, className, children, ...rest }: CardHeaderProps) {
  return (
    <div className={cx(styles.header, className)} {...rest}>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </div>
  );
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx(styles.content, className)} {...rest} />;
});

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx(styles.footer, className)} {...rest} />;
});

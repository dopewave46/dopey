import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const iconSize = size === "sm" ? 15 : 16;
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && iconLeft && <Icon name={iconLeft} size={iconSize} weight={2.1} />}
      {children && <span className={styles.label}>{children}</span>}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} weight={2.1} />}
    </button>
  );
});

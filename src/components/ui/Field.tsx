import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import styles from "./Field.module.css";

interface BaseFieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, BaseFieldProps & InputHTMLAttributes<HTMLInputElement>>(
  function Input({ label, hint, error, required, className, id, ...rest }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className={cn(styles.field, error && styles.invalid)}>
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={cn(styles.control, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
          {...rest}
        />
        {error ? (
          <span id={`${fieldId}-err`} className={styles.error}>
            <Icon name="alert-circle" size={13} weight={2} />
            {error}
          </span>
        ) : (
          hint && (
            <span id={`${fieldId}-hint`} className={styles.hint}>
              {hint}
            </span>
          )
        )}
      </div>
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ label, hint, error, required, className, id, children, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn(styles.field, error && styles.invalid)}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={styles.selectWrap}>
        <select ref={ref} id={fieldId} className={cn(styles.control, className)} {...rest}>
          {children}
        </select>
        <Icon name="chevron-down" size={15} className={styles.selectCaret} />
      </div>
      {error ? (
        <span className={styles.error}>
          <Icon name="alert-circle" size={13} weight={2} />
          {error}
        </span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, hint, error, required, className, id, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn(styles.field, error && styles.invalid)}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={cn(styles.control, styles.textarea, className)}
        {...rest}
      />
      {error ? (
        <span className={styles.error}>
          <Icon name="alert-circle" size={13} weight={2} />
          {error}
        </span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
});

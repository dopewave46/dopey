import { useId } from "react";
import { Icon } from "@/components/icons/Icon";
import styles from "./InlineSelect.module.css";

export interface InlineSelectOption {
  value: string;
  label: string;
}

export interface InlineSelectProps {
  label: string;
  value: string;
  options: InlineSelectOption[];
  onChange: (value: string) => void;
  /** Shown as the first option, e.g. "All stages". */
  allLabel?: string;
}

/** Compact filter dropdown — label + native select, styled as a toolbar control. */
export function InlineSelect({ label, value, options, onChange, allLabel }: InlineSelectProps) {
  const selectId = useId();
  const active = value !== "";
  return (
    <div className={styles.wrap} data-active={active}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {allLabel !== undefined && <option value="">{allLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={14} className={styles.caret} />
      </div>
    </div>
  );
}

import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./SegmentedControl.module.css";

export interface Segment<V extends string> {
  value: V;
  label: string;
  icon?: IconName;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  options: Segment<V>[];
  onChange: (value: V) => void;
  "aria-label": string;
}

export function SegmentedControl<V extends string>({
  value,
  options,
  onChange,
  ...rest
}: SegmentedControlProps<V>) {
  return (
    <div className={styles.group} role="tablist" aria-label={rest["aria-label"]}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={cn(styles.segment, value === opt.value && styles.active)}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <Icon name={opt.icon} size={15} weight={1.9} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

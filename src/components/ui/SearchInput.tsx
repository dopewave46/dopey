import { Icon } from "@/components/icons/Icon";
import styles from "./SearchInput.module.css";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search…", ...rest }: SearchInputProps) {
  return (
    <div className={styles.wrap}>
      <Icon name="search" size={15} weight={1.9} className={styles.icon} />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={rest["aria-label"] ?? placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange("")} aria-label="Clear search">
          <Icon name="close" size={13} weight={2.2} />
        </button>
      )}
    </div>
  );
}

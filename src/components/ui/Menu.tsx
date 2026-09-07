import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import styles from "./Menu.module.css";

export interface MenuItem {
  label: string;
  icon?: IconName;
  onSelect?: () => void;
  href?: string;
  tone?: "default" | "danger";
  /** Renders a divider above this item. */
  divided?: boolean;
}

export interface MenuProps {
  /** Render-prop for the trigger; receives props to spread onto a button. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  header?: ReactNode;
}

export function Menu({ trigger, items, align = "end", header }: MenuProps) {
  const { isOpen, close, toggle } = useDisclosure();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useOnClickOutside(wrapRef, close, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const first = listRef.current?.querySelector<HTMLElement>("[role='menuitem']");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {trigger({
        ref: triggerRef,
        onClick: toggle,
        "aria-haspopup": "menu",
        "aria-expanded": isOpen,
        "aria-controls": menuId,
      })}

      {isOpen && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          className={cn(styles.list, align === "end" ? styles.alignEnd : styles.alignStart)}
        >
          {header && <div className={styles.header}>{header}</div>}
          {items.map((item, i) => {
            const content = (
              <>
                {item.icon && <Icon name={item.icon} size={16} />}
                <span>{item.label}</span>
              </>
            );
            const classes = cn(styles.item, item.tone === "danger" && styles.danger);
            return (
              <div key={item.label} className={item.divided && i > 0 ? styles.dividedGroup : undefined}>
                {item.href ? (
                  <a role="menuitem" className={classes} href={item.href} onClick={close}>
                    {content}
                  </a>
                ) : (
                  <button
                    role="menuitem"
                    type="button"
                    className={classes}
                    onClick={() => {
                      item.onSelect?.();
                      close();
                    }}
                  >
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { Icon } from "@/components/icons/Icon";
import { useDisclosure } from "@/hooks/useDisclosure";
import { SearchPalette } from "./SearchPalette";
import styles from "./GlobalSearch.module.css";

/**
 * Header search entry point. The input is a button that opens the palette;
 * Cmd/Ctrl+K opens it from anywhere. Wiring to real search across
 * Clients / Leads / Projects / Tasks / Invoices happens in a later prompt.
 */
export function GlobalSearch() {
  const palette = useDisclosure();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        palette.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette]);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={palette.open}>
        <Icon name="search" size={15} weight={1.9} />
        <span className={styles.placeholder}>Search projects, clients, leads…</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>
      <SearchPalette open={palette.isOpen} onClose={palette.close} />
    </>
  );
}

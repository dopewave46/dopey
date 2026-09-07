import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useMediaQuery, BREAKPOINTS } from "@/hooks/useMediaQuery";
import { useDisclosure } from "@/hooks/useDisclosure";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { MobileNav } from "@/components/shell/MobileNav";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import styles from "./AppShell.module.css";

const COLLAPSE_KEY = "orca.sidebar.collapsed";

export function AppShell() {
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  const { pathname } = useLocation();
  const mobileNav = useDisclosure();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable — non-critical */
      }
      return next;
    });
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    mobileNav.close();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn(styles.shell, collapsed && styles.collapsed)}>
      {isDesktop && (
        <aside className={styles.sidebar}>
          <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>
      )}

      <div className={styles.main}>
        <div className={styles.headerSlot}>
          <Header onOpenMobileNav={mobileNav.open} />
        </div>
        <main className={styles.content} id="main-content">
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>

      {!isDesktop && (
        <>
          <MobileNav open={mobileNav.isOpen} onClose={mobileNav.close} />
          <BottomTabBar />
        </>
      )}
    </div>
  );
}

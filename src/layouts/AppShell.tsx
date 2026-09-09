import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useMediaQuery, BREAKPOINTS } from "@/hooks/useMediaQuery";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAuth } from "@/services/auth";
import { hydrateAll, useAppData } from "@/services/hydration";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { MobileNav } from "@/components/shell/MobileNav";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import styles from "./AppShell.module.css";

const COLLAPSE_KEY = "orca.sidebar.collapsed";

export function AppShell() {
  const { status: authStatus, refresh } = useAuth();
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  const { pathname } = useLocation();
  const mobileNav = useDisclosure();
  const appData = useAppData();

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

  // Load every module store once the session is confirmed.
  useEffect(() => {
    if (authStatus === "authed") void hydrateAll();
  }, [authStatus]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    mobileNav.close();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authStatus === "loading") {
    return (
      <div className={styles.boot} aria-busy="true">
        <span className={styles.bootMark} />
      </div>
    );
  }
  if (authStatus === "unauthed") {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }
  if (authStatus === "offline") {
    return (
      <div className={styles.boot}>
        <ErrorState
          title="Can't reach the server"
          message="The DopeOrca OS backend isn't responding. Check your connection and try again."
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

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
            {appData.error ? (
              <ErrorState
                title="Couldn't load your data"
                message={appData.error}
                onRetry={appData.retry}
              />
            ) : appData.loading ? (
              <div style={{ display: "grid", gap: "var(--s-4)" }}>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <Outlet />
            )}
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

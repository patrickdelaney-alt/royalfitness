"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { HiHome, HiChartBar, HiPlusCircle, HiUser } from "react-icons/hi";
import { HiBell } from "react-icons/hi2";
import { BOTTOM_NAV_BASE_HEIGHT_REM, BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav.constants";

// Explore is intentionally NOT here — it lives as a search icon in the feed
// header (FeedContent.tsx), which is the standard pattern (Instagram, etc.).
// The 5-tab layout gives each item more breathing room on narrow screens.
const tabs = [
  { href: "/feed",          label: "Feed",    icon: HiHome },
  { href: "/stats",         label: "Stats",   icon: HiChartBar },
  { href: "/create",        label: "Create",  icon: HiPlusCircle },
  { href: "/notifications", label: "Alerts",  icon: HiBell },
  { href: "/profile",       label: "Profile", icon: HiUser },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  const feedFilter = searchParams.get("filter");

  // Primary effect: runs once on mount.
  // Fetches on initial load, on tab/window visibility restore, and every 5 minutes
  // as a conservative fallback. Navigation does NOT restart this effect.
  useEffect(() => {
    let cancelled = false;
    const isFetching = { current: false }; // guard against concurrent requests

    async function fetchCount() {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            if (data.count > prevCountRef.current && prevCountRef.current > 0) {
              toast("You have new notifications", {
                icon: "🔔",
                style: {
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                },
              });
            }
            prevCountRef.current = data.count;
            setUnreadCount(data.count);
          }
        }
      } catch {
        // silent
      } finally {
        isFetching.current = false;
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 5 * 60_000); // 5 minutes

    function handleVisibility() {
      if (document.visibilityState === "visible") fetchCount();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Secondary effect: refresh the badge count only when the user navigates TO
  // the notifications tab. This keeps the badge accurate at the moment the user
  // is actively looking at their notifications, without re-running on every
  // other route change.
  useEffect(() => {
    if (pathname !== "/notifications") return;

    let cancelled = false;
    fetch("/api/notifications/unread-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !cancelled) {
          prevCountRef.current = data.count;
          setUnreadCount(data.count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        height: BOTTOM_NAV_HEIGHT,
        background: "rgba(253,250,245,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--border)",
        boxShadow: "0 -1px 8px rgba(24,25,15,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      <div
        className="flex items-center"
        style={{ height: `${BOTTOM_NAV_BASE_HEIGHT_REM}rem` }}
      >
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          let href = tab.href;
          if (tab.href === "/create" && pathname.startsWith("/feed") && feedFilter && feedFilter !== "ALL") {
            href = `/create?type=${feedFilter}`;
          }

          // Create tab gets a distinct pill style to stand out as the primary action
          if (tab.href === "/create") {
            return (
              <Link
                key={tab.href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                aria-label="Create post"
              >
                <div
                  className="flex h-7 w-11 items-center justify-center rounded-full btn-primary"
                  style={{ padding: 0, boxShadow: "0 2px 8px rgba(36,63,22,0.20)" }}
                >
                  <tab.icon className="h-5 w-5" style={{ color: "#FDFAF5" }} />
                </div>
                {/* Invisible spacer — matches the label height of other tabs so
                    this cell has the same natural height and the pill icon
                    vertically aligns with adjacent tab icons. */}
                <span className="invisible text-[11px] font-semibold" aria-hidden="true">
                  Create
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold"
              style={{
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                transition: "color 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {isActive && <div className="nav-tab-pill" />}
              <div
                className="relative"
                style={{
                  transform: isActive ? "scale(1.12)" : "scale(1)",
                  transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                <tab.icon className="h-[22px] w-[22px]" />
                {tab.href === "/notifications" && unreadCount > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{ background: "var(--gold)", color: "var(--surface)" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

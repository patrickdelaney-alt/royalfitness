"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HiHome, HiSearch, HiPlusCircle, HiUser } from "react-icons/hi";
import { HiBell } from "react-icons/hi2";

const tabs = [
  { href: "/feed", label: "Feed", icon: HiHome },
  { href: "/explore", label: "Explore", icon: HiSearch },
  { href: "/create", label: "Create", icon: HiPlusCircle },
  { href: "/notifications", label: "Alerts", icon: HiBell },
  { href: "/profile", label: "Profile", icon: HiUser },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);

  // Pass the current feed filter to the create page so new posts default
  // to the category the user is exploring
  const feedFilter = searchParams.get("filter");

  // Poll unread notification count
  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUnreadCount(data.count);
        }
      } catch {
        // silent
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000); // every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]); // re-fetch when navigating

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-white">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        let href = tab.href;
        // If on feed with a filter, pass it through to the create page
        if (tab.href === "/create" && pathname.startsWith("/feed") && feedFilter && feedFilter !== "ALL") {
          href = `/create?type=${feedFilter}`;
        }
        return (
          <Link
            key={tab.href}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive
                ? "text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <div className="relative">
              <tab.icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
              {tab.href === "/notifications" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

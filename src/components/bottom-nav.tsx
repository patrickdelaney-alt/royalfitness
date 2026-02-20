"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HiHome, HiSearch, HiPlusCircle, HiChartBar, HiUser } from "react-icons/hi";

const tabs = [
  { href: "/feed", label: "Feed", icon: HiHome },
  { href: "/explore", label: "Explore", icon: HiSearch },
  { href: "/create", label: "Create", icon: HiPlusCircle },
  { href: "/stats", label: "Stats", icon: HiChartBar },
  { href: "/profile", label: "Profile", icon: HiUser },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pass the current feed filter to the create page so new posts default
  // to the category the user is exploring
  const feedFilter = searchParams.get("filter");

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
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive
                ? "text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <tab.icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

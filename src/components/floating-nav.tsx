"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
  HiOutlineUser,
} from "react-icons/hi";
import { HiOutlineBell, HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";

// ─── Nav tabs (all 6 routes preserved) ────────────────────────────────────────
const NAV_TABS = [
  { href: "/feed",          label: "Feed",    Icon: HiOutlineHome },
  { href: "/explore",       label: "Search",  Icon: HiOutlineSearch },
  { href: "/create",        label: "Create",  Icon: HiOutlinePlusCircle },
  { href: "/stats",         label: "Stats",   Icon: HiOutlineChartBar },
  { href: "/notifications", label: "Alerts",  Icon: HiOutlineBell },
  { href: "/profile",       label: "Me",      Icon: HiOutlineUser },
];

// Width (px) of each button slot — must match the inline style below
const BUTTON_W = 52;
const NAV_PAD  = 6;   // nav internal padding

// Film grain SVG as a data URI (feTurbulence fractal noise)
const GRAIN_URL =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

// ─── Gold conic-gradient ring colours ────────────────────────────────────────
// Pattern repeats twice across 360° for symmetry.
// 70 % gold tones, two ~3 % white hotspots, tiny pink/blue iridescence.
const CONIC_GRADIENT = `conic-gradient(
  from 0deg,
  #533517  0%,
  #c49746  14%,
  #feeaa5  32%,
  #ffffff  34%,
  #ffffff  37%,
  #ffc0cb  38.5%,
  #b8d4f0  40%,
  #feeaa5  42%,
  #c49746  54%,
  #533517  66%,
  #c49746  74%,
  #feeaa5  82%,
  #ffffff  84%,
  #ffffff  87%,
  #ffc0cb  88.5%,
  #b8d4f0  90%,
  #feeaa5  92%,
  #c49746  96%,
  #533517 100%
)`;

export function FloatingNav() {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark,      setIsDark]      = useState(true);
  const [isBouncing,  setIsBouncing]  = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // ── Active tab index ───────────────────────────────────────────────────────
  const activeIdx = NAV_TABS.findIndex((t) => pathname.startsWith(t.href));
  const indicatorLeft = activeIdx >= 0 ? NAV_PAD + activeIdx * BUTTON_W : -999;

  // ── Theme — read from localStorage on mount ────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("rf-theme");
    const dark  = saved ? saved === "dark" : true;
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, []);

  // ── Theme toggle ───────────────────────────────────────────────────────────
  function handleToggle() {
    setIsBouncing(true);
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("rf-theme", next ? "dark" : "light");
  }

  // ── Notification count (poll every 30 s) ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUnreadCount(data.count);
        }
      } catch { /* silent */ }
    }
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [pathname]);

  // ── Feed filter pass-through for Create tab ────────────────────────────────
  const feedFilter = searchParams.get("filter");

  // ── Toolbar background (dark vs light) ────────────────────────────────────
  const navBg    = isDark ? "rgba(11,12,20,0.82)"    : "rgba(240,240,245,0.80)";
  const plateBg  = isDark ? "rgba(11,12,20,0.92)"    : "rgba(240,240,245,0.92)";
  const dividerC = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const iconDim  = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.30)";
  const iconAct  = "#c49746"; // always gold for the active tab

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position:       "fixed",
        bottom:         24,
        left:           "50%",
        transform:      "translateX(-50%)",
        zIndex:         50,
        display:        "flex",
        alignItems:     "center",
        background:     navBg,
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border:         "1px solid rgba(255,255,255,0.10)",
        borderRadius:   22,
        padding:        NAV_PAD,
        gap:            0,
        // film grain noise overlay via box-shadow trick + pseudo via CSS
        isolation:      "isolate",
        overflow:       "hidden",
      }}
    >
      {/* ── Film grain overlay ─────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:       "absolute",
          inset:          0,
          backgroundImage: GRAIN_URL,
          backgroundSize: "200px 200px",
          opacity:        0.038,
          pointerEvents:  "none",
          borderRadius:   "inherit",
          zIndex:         10,
        }}
      />

      {/* ── Radial ambient glow (gold, behind nav) ────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:   "absolute",
          inset:      "-30px -20px",
          background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(196,151,70,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex:     -1,
        }}
      />

      {/* ── Sliding active indicator ──────────────────────────────────────── */}
      {activeIdx >= 0 && (
        <div
          aria-hidden
          style={{
            position:   "absolute",
            top:        NAV_PAD,
            left:       indicatorLeft,
            width:      BUTTON_W,
            height:     44,
            transition: "left 0.42s cubic-bezier(0.34, 1.2, 0.64, 1)",
            zIndex:     1,
          }}
        >
          {/* Layer 1 — blurred warm-gold glow */}
          <div style={{
            position:  "absolute",
            inset:     -4,
            background: "rgba(232,175,72,0.15)",
            borderRadius: 22,
            filter:    "blur(8px)",
          }} />

          {/* Layer 2+3 — clip box + spinning conic ring */}
          <div style={{
            position:     "absolute",
            inset:        0,
            borderRadius: 18,
            overflow:     "hidden",
          }}>
            <div style={{
              position:   "absolute",
              width:      "200%",
              height:     "200%",
              top:        "-50%",
              left:       "-50%",
              background: CONIC_GRADIENT,
              animation:  "spin-ring 4.5s linear infinite",
            }} />
          </div>

          {/* Layer 4 — inner plate (covers center, leaves 2 px ring visible) */}
          <div style={{
            position:     "absolute",
            inset:        2,
            borderRadius: 16,
            background:   plateBg,
          }} />
        </div>
      )}

      {/* ── Nav buttons ───────────────────────────────────────────────────── */}
      {NAV_TABS.map((tab, idx) => {
        const isActive = pathname.startsWith(tab.href);
        let href = tab.href;
        if (tab.href === "/create" && pathname.startsWith("/feed") && feedFilter && feedFilter !== "ALL") {
          href = `/create?type=${feedFilter}`;
        }

        return (
          <Link
            key={tab.href}
            href={href}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              position:       "relative",
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              width:          BUTTON_W,
              height:         44,
              gap:            2,
              fontSize:       9,
              fontWeight:     600,
              letterSpacing:  "0.04em",
              color:          isActive ? iconAct : iconDim,
              textDecoration: "none",
              transition:     "color 0.2s",
              zIndex:         2,
            }}
          >
            <div style={{ position: "relative" }}>
              <tab.Icon style={{ width: 20, height: 20, strokeWidth: 1.5 }} />
              {/* Notification badge */}
              {tab.href === "/notifications" && unreadCount > 0 && (
                <span style={{
                  position:       "absolute",
                  top:            -6,
                  right:          -8,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  minWidth:       16,
                  height:         16,
                  borderRadius:   8,
                  background:     "#ef4444",
                  color:          "#fff",
                  fontSize:       9,
                  fontWeight:     700,
                  padding:        "0 3px",
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span style={{ lineHeight: 1 }}>{tab.label}</span>
          </Link>
        );
      })}

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{
        width:        1,
        height:       26,
        background:   dividerC,
        margin:       "0 4px",
        flexShrink:   0,
        zIndex:       2,
      }} />

      {/* ── Theme toggle ──────────────────────────────────────────────────── */}
      <button
        ref={toggleRef}
        onClick={handleToggle}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onAnimationEnd={() => setIsBouncing(false)}
        style={{
          position:       "relative",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          BUTTON_W,
          height:         44,
          background:     "none",
          border:         "none",
          cursor:         "pointer",
          padding:        0,
          flexShrink:     0,
          zIndex:         2,
          animation:      isBouncing ? "toggle-bounce 0.42s cubic-bezier(0.34,1.2,0.64,1)" : "none",
        }}
      >
        {/* Sun icon — visible in dark mode (click to go light) */}
        <HiOutlineSun
          style={{
            position:  "absolute",
            width:     20,
            height:    20,
            color:     iconDim,
            animation: isDark ? "icon-in 0.3s ease forwards" : "icon-out 0.3s ease forwards",
            pointerEvents: "none",
          }}
        />
        {/* Moon icon — visible in light mode (click to go dark) */}
        <HiOutlineMoon
          style={{
            position:  "absolute",
            width:     20,
            height:    20,
            color:     iconDim,
            animation: isDark ? "icon-out 0.3s ease forwards" : "icon-in 0.3s ease forwards",
            pointerEvents: "none",
          }}
        />
      </button>
    </nav>
  );
}

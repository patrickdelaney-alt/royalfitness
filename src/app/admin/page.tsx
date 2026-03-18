"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HiUserCircle } from "react-icons/hi2";

// ─── Shared helpers ───────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Users tab types & components ────────────────────────────────

interface AdminUser {
  id: string;
  name: string | null;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  signupMethod: string;
}

function SignupBadge({ method }: { method: string }) {
  const isEmail = method === "email";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={
        isEmail
          ? { background: "rgba(36,63,22,0.10)", color: "#528531" }
          : { background: "rgba(36,63,22,0.07)", color: "var(--text-muted)" }
      }
    >
      {isEmail ? "Email" : method.charAt(0).toUpperCase() + method.slice(1)}
    </span>
  );
}

// ─── Waitlist tab types & components ─────────────────────────────

type WaitlistStatus = "PENDING" | "APPROVED" | "INVITED" | "ACTIVATED";

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string | null;
  status: WaitlistStatus;
  createdAt: string;
  approvedAt: string | null;
  inviteSentAt: string | null;
}

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  INVITED: "Invited",
  ACTIVATED: "Activated",
};

const STATUS_COLORS: Record<
  WaitlistStatus,
  { bg: string; color: string }
> = {
  PENDING: { bg: "rgba(154,123,46,0.12)", color: "#9A7B2E" },
  APPROVED: { bg: "rgba(36,63,22,0.12)", color: "#528531" },
  INVITED: { bg: "rgba(36,63,22,0.08)", color: "#3A6122" },
  ACTIVATED: { bg: "rgba(36,63,22,0.18)", color: "#243F16" },
};

function WaitlistStatusBadge({ status }: { status: WaitlistStatus }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function WaitlistActionButton({
  entry,
  onAction,
  loading,
}: {
  entry: WaitlistEntry;
  onAction: (id: string, action: "approve" | "mark_invited" | "activate") => void;
  loading: boolean;
}) {
  if (entry.status === "PENDING") {
    return (
      <button
        onClick={() => onAction(entry.id, "approve")}
        disabled={loading}
        className="text-xs px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        style={{ background: "rgba(36,63,22,0.12)", color: "#528531" }}
      >
        Approve
      </button>
    );
  }
  if (entry.status === "APPROVED") {
    return (
      <button
        onClick={() => onAction(entry.id, "mark_invited")}
        disabled={loading}
        className="text-xs px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        style={{ background: "rgba(154,123,46,0.10)", color: "#9A7B2E" }}
      >
        Mark Invited
      </button>
    );
  }
  if (entry.status === "INVITED") {
    return (
      <button
        onClick={() => onAction(entry.id, "activate")}
        disabled={loading}
        className="text-xs px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        style={{ background: "rgba(36,63,22,0.07)", color: "var(--text-muted)" }}
      >
        Activate
      </button>
    );
  }
  // ACTIVATED — no further action
  return (
    <span
      className="text-xs px-3 py-1 rounded-full font-medium"
      style={{ background: "rgba(36,63,22,0.05)", color: "var(--text-muted)" }}
    >
      Active
    </span>
  );
}

// ─── Waitlist tab ─────────────────────────────────────────────────

function WaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | "ALL">("ALL");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchEntries = useCallback(
    async (reset = false, filter: WaitlistStatus | "ALL" = statusFilter) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({ limit: "50" });
        if (filter !== "ALL") params.set("status", filter);
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/waitlist?${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        if (reset) setEntries(data.entries);
        else setEntries((prev) => [...prev, ...data.entries]);

        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
        setTotalCount(data.totalCount);
        setStatusCounts(data.statusCounts ?? {});
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cursor, statusFilter]
  );

  // Initial load
  useEffect(() => {
    fetchEntries(true, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchEntries(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchEntries]);

  async function handleAction(
    id: string,
    action: "approve" | "mark_invited" | "activate"
  ) {
    setActionLoading(id);

    // Optimistic update
    const STATUS_MAP: Record<string, WaitlistStatus> = {
      approve: "APPROVED",
      mark_invited: "INVITED",
      activate: "ACTIVATED",
    };
    const prevEntries = entries;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: STATUS_MAP[action] } : e
      )
    );

    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Sync with server response
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? data.entry : e))
      );
    } catch {
      // Revert on error
      setEntries(prevEntries);
    } finally {
      setActionLoading(null);
    }
  }

  const filterButtons: Array<{ key: WaitlistStatus | "ALL"; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "INVITED", label: "Invited" },
    { key: "ACTIVATED", label: "Activated" },
  ];

  const totalAll =
    Object.values(statusCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "#528531", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Status filter row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterButtons.map(({ key, label }) => {
          const count =
            key === "ALL" ? totalAll : (statusCounts[key] ?? 0);
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => {
                setCursor(undefined);
                setStatusFilter(key);
              }}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-colors"
              style={
                active
                  ? { background: "var(--brand)", color: "#fff" }
                  : {
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {label} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          No waitlist entries{statusFilter !== "ALL" ? ` with status "${STATUS_LABELS[statusFilter as WaitlistStatus]}"` : ""}.
        </p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(36,63,22,0.10)" }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: "var(--surface)",
                borderBottom:
                  i < entries.length - 1
                    ? "1px solid rgba(36,63,22,0.05)"
                    : undefined,
              }}
            >
              {/* Avatar placeholder */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(36,63,22,0.08)", color: "var(--brand)" }}
              >
                {(entry.firstName ?? entry.email)[0].toUpperCase()}
              </div>

              {/* Email + name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">
                    {entry.firstName ?? entry.email.split("@")[0]}
                  </p>
                  <WaitlistStatusBadge status={entry.status} />
                </div>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {entry.email}
                </p>
              </div>

              {/* Date + action */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(entry.createdAt)}
                </p>
                <WaitlistActionButton
                  entry={entry}
                  onAction={handleAction}
                  loading={actionLoading === entry.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-6">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "#528531", borderTopColor: "transparent" }}
          />
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </>
  );
}

// ─── Main admin page ──────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Active tab: "users" | "waitlist"
  const [tab, setTab] = useState<"users" | "waitlist">("users");

  // ── Users tab state ──────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [userCursor, setUserCursor] = useState<string | undefined>();
  const [userHasMore, setUserHasMore] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersLoadingMore, setUsersLoadingMore] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const userSentinelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    async (reset = false) => {
      if (reset) setUsersLoading(true);
      else setUsersLoadingMore(true);

      try {
        const params = new URLSearchParams({ limit: "50" });
        if (!reset && userCursor) params.set("cursor", userCursor);

        const res = await fetch(`/api/admin/users?${params}`);
        if (res.status === 403) { setForbidden(true); return; }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        if (reset) setUsers(data.users);
        else setUsers((prev) => [...prev, ...data.users]);
        setUserCursor(data.nextCursor);
        setUserHasMore(!!data.nextCursor);
        setTotalUserCount(data.totalCount);
      } catch {
        // silent
      } finally {
        setUsersLoading(false);
        setUsersLoadingMore(false);
      }
    },
    [userCursor]
  );

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/signin"); return; }
    if (status === "authenticated") fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (!userSentinelRef.current || !userHasMore || usersLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && userHasMore && !usersLoadingMore) fetchUsers(false);
      },
      { rootMargin: "200px" }
    );
    observer.observe(userSentinelRef.current);
    return () => observer.disconnect();
  }, [userHasMore, usersLoadingMore, fetchUsers]);

  // ── Loading / forbidden guards ───────────────────────────────────
  if (status === "loading" || (tab === "users" && usersLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "#528531", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <p style={{ color: "var(--text-muted)" }}>Access denied.</p>
      </div>
    );
  }

  const emailCount = users.filter((u) => u.signupMethod === "email").length;
  const oauthCount = users.filter((u) => u.signupMethod !== "email").length;

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-sm font-bold text-white">
          RF
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{session?.user?.email}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {(["users", "waitlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={
              tab === t
                ? { background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }
                : { color: "var(--text-muted)" }
            }
          >
            {t === "users" ? "App Users" : "Waitlist"}
          </button>
        ))}
      </div>

      {/* ── App Users tab ─────────────────────────────────────────── */}
      {tab === "users" && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Total Users", value: totalUserCount },
              { label: "Email Signups", value: emailCount },
              { label: "OAuth Signups", value: oauthCount },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Recent Signups
          </h2>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(36,63,22,0.10)" }}>
            {users.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "var(--surface)", borderBottom: i < users.length - 1 ? "1px solid rgba(36,63,22,0.05)" : undefined }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <HiUserCircle className="w-9 h-9 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{user.name ?? user.username}</p>
                    <SignupBadge method={user.signupMethod} />
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
                <p className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{timeAgo(user.createdAt)}</p>
              </div>
            ))}
          </div>

          {usersLoadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#528531", borderTopColor: "transparent" }} />
            </div>
          )}
          <div ref={userSentinelRef} className="h-1" />
        </>
      )}

      {/* ── Waitlist tab ───────────────────────────────────────────── */}
      {tab === "waitlist" && <WaitlistTab />}
    </div>
  );
}

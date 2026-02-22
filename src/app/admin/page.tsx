"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HiUserCircle } from "react-icons/hi2";

interface AdminUser {
  id: string;
  name: string | null;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  signupMethod: string;
}

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

function SignupBadge({ method }: { method: string }) {
  const isEmail = method === "email";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={
        isEmail
          ? { background: "rgba(109,106,245,0.15)", color: "#8b88f8" }
          : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }
      }
    >
      {isEmail ? "Email" : method.charAt(0).toUpperCase() + method.slice(1)}
    </span>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({ limit: "50" });
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/users?${params}`);

        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();

        if (reset) {
          setUsers(data.users);
        } else {
          setUsers((prev) => [...prev, ...data.users]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
        setTotalCount(data.totalCount);
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (status === "authenticated") {
      fetchUsers(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchUsers(false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchUsers]);

  if (status === "loading" || loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0b0c14" }}
      >
        <div
          className="w-7 h-7 border-2 rounded-full animate-spin"
          style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0b0c14", color: "#fff" }}
      >
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Access denied.</p>
      </div>
    );
  }

  const emailCount = users.filter((u) => u.signupMethod === "email").length;
  const oauthCount = users.filter((u) => u.signupMethod !== "email").length;

  return (
    <div
      className="min-h-screen px-4 py-8 max-w-3xl mx-auto"
      style={{ background: "#0b0c14", color: "#ffffff" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-xl">
          👑
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {session?.user?.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total Users", value: totalCount },
          { label: "Email Signups", value: emailCount },
          { label: "OAuth Signups", value: oauthCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* User list */}
      <h2
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Recent Signups
      </h2>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {users.map((user, i) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: "#13141f",
              borderBottom:
                i < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined,
            }}
          >
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <HiUserCircle
                className="w-9 h-9 flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.2)" }}
              />
            )}

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">
                  {user.name ?? user.username}
                </p>
                <SignupBadge method={user.signupMethod} />
              </div>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {user.email}
              </p>
            </div>

            {/* Time */}
            <p
              className="text-xs flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {timeAgo(user.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-6">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }}
          />
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

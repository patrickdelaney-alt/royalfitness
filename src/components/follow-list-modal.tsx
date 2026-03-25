"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { HiXMark, HiUserCircle } from "react-icons/hi2";
import BottomSheetShell from "@/components/layout/BottomSheetShell";

interface FollowUser {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface FollowListModalProps {
  username: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FollowListModal({
  username,
  type,
  isOpen,
  onClose,
}: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({ limit: "30" });
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(
          `/api/users/${encodeURIComponent(username)}/${type}?${params}`
        );

        if (res.status === 403) {
          setError("This account is private.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        if (reset) {
          setUsers(data.users);
        } else {
          setUsers((prev) => [...prev, ...data.users]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username, type, cursor]
  );

  // Reset and fetch when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setUsers([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, username, type]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchUsers(false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchUsers]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <BottomSheetShell
      onClose={onClose}
      lockBodyScroll
      panelClassName="rounded-t-2xl sm:max-w-md"
      panelStyle={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        maxHeight: "75vh",
        boxShadow: "var(--shadow-lg)",
      }}
      backdropStyle={{ background: "rgba(24,25,15,0.5)" }}
      header={
        <>
          <div className="flex justify-center pt-3 pb-1">
            <div className="sheet-handle" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-normal text-base" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[--surface-2]"
              style={{ color: "var(--text-muted)", transition: "background 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </>
      }
      bodyClassName="flex-1 min-h-0"
    >
      <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "rgba(36,63,22,0.35)", borderTopColor: "transparent" }}
              />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {error}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {type === "followers" ? "No followers yet." : "Not following anyone yet."}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[--surface-2]"
                  style={{ transition: "background 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : user.name ? (
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold btn-gradient"
                      style={{ color: "#FDFAF5" }}
                    >
                      {initials(user.name)}
                    </div>
                  ) : (
                    <HiUserCircle className="w-10 h-10 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                      {user.username}
                    </p>
                    {user.name && (
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {user.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(36,63,22,0.35)", borderTopColor: "transparent" }}
                  />
                </div>
              )}
              <div ref={sentinelRef} className="h-1" />
            </div>
          )}
      </div>
    </BottomSheetShell>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { HiXMark, HiUserCircle } from "react-icons/hi2";

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

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl"
        style={{
          background: "#13141f",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "75vh",
        }}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <h2 className="font-semibold text-base text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ overscrollBehavior: "contain" }}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }}
              />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {error}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
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
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : user.name ? (
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold btn-gradient"
                    >
                      {initials(user.name)}
                    </div>
                  ) : (
                    <HiUserCircle className="w-10 h-10 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.username}
                    </p>
                    {user.name && (
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
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
                    style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }}
                  />
                </div>
              )}
              <div ref={sentinelRef} className="h-1" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

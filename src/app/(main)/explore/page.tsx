"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HiSearch, HiLocationMarker } from "react-icons/hi";
import Link from "next/link";
import { lightImpact } from "@/lib/haptics";

interface UserResult {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface GymResult {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  _count: { members: number; posts: number };
}

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  _count: { posts: number };
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

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"people" | "gyms">("people");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [gyms, setGyms] = useState<GymResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followingId, setFollowingId] = useState<string | null>(null);

  // Load all gyms whenever the gyms tab is active (empty query = browse all)
  const loadAllGyms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gyms");
      if (res.ok) {
        const data: GymResult[] = await res.json();
        setGyms(data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load gyms when switching to the Gyms tab with no query
  useEffect(() => {
    if (tab !== "gyms") return;
    if (query.trim().length === 0) {
      loadAllGyms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Fetch suggested users when on People tab with empty query
  useEffect(() => {
    if (tab !== "people") return;
    setSuggestionsLoading(true);
    fetch("/api/users/suggested")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.users ?? []))
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  }, [tab]);

  // Debounced search — only runs when there is a query
  useEffect(() => {
    if (query.trim().length === 0) {
      setUsers([]);
      if (tab === "gyms") loadAllGyms();
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (tab === "people") {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users ?? []);
          }
        } else {
          const res = await fetch(`/api/gyms?q=${encodeURIComponent(query.trim())}`);
          if (res.ok) {
            // API returns a bare array
            const data: GymResult[] = await res.json();
            setGyms(data ?? []);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  async function handleFollow(suggestion: SuggestedUser) {
    setFollowingId(suggestion.id);
    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: suggestion.id }),
      });
      if (res.ok) {
        lightImpact();
        setFollowedIds((prev) => new Set([...prev, suggestion.id]));
      }
    } catch {
      // silent
    } finally {
      setFollowingId(null);
    }
  }

  const showSuggestions = tab === "people" && query.trim().length === 0;
  const trimmedQuery = query.trim();
  const helperText =
    tab === "people"
      ? "Search by username or name"
      : "Search gyms by name or browse all";

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Explore</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "people" ? "Search people..." : "Search gyms..."}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {trimmedQuery.length > 0 && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-muted -mt-2 mb-4">{helperText}</p>

      {/* Tab switch */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("people")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "people"
              ? "bg-primary text-white"
              : "bg-card text-foreground hover:bg-card/80"
          }`}
        >
          People
        </button>
        <button
          onClick={() => setTab("gyms")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "gyms"
              ? "bg-primary text-white"
              : "bg-card text-foreground hover:bg-card/80"
          }`}
        >
          Gyms
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : showSuggestions ? (
        suggestionsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded bg-muted/20 animate-pulse w-28" />
                  <div className="h-3 rounded bg-muted/20 animate-pulse w-16" />
                </div>
                <div className="w-16 h-7 rounded-lg bg-muted/20 animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? null : (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
              People to follow
            </p>
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const followed = followedIds.has(suggestion.id);
                const isFollowing = followingId === suggestion.id;
                const postCount = suggestion._count.posts;
                return (
                  <div
                    key={suggestion.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <Link href={`/profile/${suggestion.username}`} className="flex-shrink-0">
                      {suggestion.avatarUrl ? (
                        <img
                          src={suggestion.avatarUrl}
                          alt={suggestion.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                          {initials(suggestion.name)}
                        </div>
                      )}
                    </Link>
                    <Link
                      href={`/profile/${suggestion.username}`}
                      className="flex-1 min-w-0"
                    >
                      <p className="font-semibold text-sm text-foreground truncate">
                        {suggestion.name ?? suggestion.username}
                      </p>
                      <p className="text-xs text-muted truncate">
                        @{suggestion.username} · {postCount} {postCount === 1 ? "post" : "posts"}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleFollow(suggestion)}
                      disabled={followed || isFollowing}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        followed
                          ? "bg-muted/20 text-muted cursor-default"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block" />
                        </span>
                      ) : followed ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : tab === "people" ? (
        users.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">
            No people matched ‘{trimmedQuery}’
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {initials(user.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {user.username}
                  </p>
                  {user.name && (
                    <p className="text-xs text-muted truncate">{user.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : /* ── Gyms tab ── */ gyms.length === 0 ? (
        trimmedQuery.length > 0 ? (
          <p className="text-center text-muted text-sm py-12">
            No gyms matched ‘{trimmedQuery}’
          </p>
        ) : (
        <div className="text-center py-16 px-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(82,133,49,0.10)", border: "1px solid rgba(82,133,49,0.2)" }}
          >
            <HiLocationMarker className="w-7 h-7" style={{ color: "#528531" }} />
          </div>
          <p className="font-semibold text-foreground text-base mb-1">No gyms yet</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Be the first to add your gym. Use Quick Check-in when posting to tag your location.
          </p>
          <Link
            href="/create?type=CHECKIN"
            className="inline-block px-5 py-2.5 rounded-full text-sm font-bold text-white"
            style={{ background: "var(--brand)", boxShadow: "0 4px 20px rgba(36,63,22,0.3)" }}
          >
            Check in at a gym →
          </Link>
        </div>
        )
      ) : (
        <div className="space-y-2">
          {query.trim().length === 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              📍 All gyms
            </p>
          )}
          {gyms.map((gym) => (
            <div
              key={gym.id}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "rgba(36,63,22,0.10)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(82,133,49,0.10)", border: "1px solid rgba(82,133,49,0.15)" }}
              >
                <HiLocationMarker className="w-5 h-5" style={{ color: "#528531" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {gym.name}
                </p>
                {gym.address && (
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {gym.address}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {gym._count.members} member{gym._count.members !== 1 ? "s" : ""}
                  {gym._count.posts > 0 && (
                    <> · {gym._count.posts} post{gym._count.posts !== 1 ? "s" : ""}</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

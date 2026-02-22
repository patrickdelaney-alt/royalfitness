"use client";

import { useState, useEffect } from "react";
import { HiSearch } from "react-icons/hi";
import Link from "next/link";

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
  _count: { members: number };
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
  const [tab, setTab] = useState<"people" | "gyms">("people");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [gyms, setGyms] = useState<GymResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setUsers([]);
      setGyms([]);
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
            const data = await res.json();
            setGyms(data.gyms ?? []);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, tab]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Explore</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "people" ? "Search people..." : "Search gyms..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

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
      ) : query.trim().length === 0 ? (
        <div className="text-center py-16">
          <HiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted text-sm">Search for people or gyms</p>
        </div>
      ) : tab === "people" ? (
        users.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">No users found</p>
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
      ) : gyms.length === 0 ? (
        <p className="text-center text-muted text-sm py-12">No gyms found</p>
      ) : (
        <div className="space-y-2">
          {gyms.map((gym) => (
            <div
              key={gym.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-muted text-lg font-bold">
                G
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {gym.name}
                </p>
                {gym.address && (
                  <p className="text-xs text-muted truncate">{gym.address}</p>
                )}
                <p className="text-xs text-muted">
                  {gym._count.members} member{gym._count.members !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { HiLogout, HiPencil, HiCheck, HiX } from "react-icons/hi";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  followerCount: number;
  followingCount: number;
}

interface PostSummary {
  id: string;
  type: string;
  caption: string | null;
  createdAt: string;
  _count: { likes: number; comments: number };
}

interface FollowRequest {
  id: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
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

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  WORKOUT: { bg: "rgba(109,106,245,0.15)", color: "#8b88f8", label: "Workout" },
  MEAL: { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Meal" },
  WELLNESS: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", label: "Wellness" },
  GENERAL: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", label: "General" },
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setPosts(data.recentPosts ?? []);
          setIsOwnProfile(data.isOwnProfile);
          setIsFollowing(data.isFollowing);
          setHasRequested(data.hasRequestedFollow);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  useEffect(() => {
    if (!isOwnProfile) return;
    setRequestsLoading(true);
    fetch("/api/social/follow-requests")
      .then((r) => r.json())
      .then((d) => setFollowRequests(d.followRequests ?? []))
      .catch(() => {})
      .finally(() => setRequestsLoading(false));
  }, [isOwnProfile]);

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/social/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      if (res.ok) {
        if (isFollowing) {
          setIsFollowing(false);
          setProfile((p) => p ? { ...p, followerCount: p.followerCount - 1 } : p);
        } else {
          if (profile.isPrivate) {
            setHasRequested(true);
          } else {
            setIsFollowing(true);
            setProfile((p) => p ? { ...p, followerCount: p.followerCount + 1 } : p);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setFollowLoading(false);
    }
  }, [profile, isFollowing, followLoading]);

  const handleAcceptRequest = async (requestId: string) => {
    const res = await fetch("/api/social/follow-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) {
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
      setProfile((p) => (p ? { ...p, followerCount: p.followerCount + 1 } : p));
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const res = await fetch("/api/social/follow-requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) {
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p style={{ color: "rgba(255,255,255,0.3)" }}>User not found</p>
      </div>
    );
  }

  const muted = "rgba(255,255,255,0.4)";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-5">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.username} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full btn-gradient flex items-center justify-center text-white text-2xl font-bold">
            {initials(profile.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{profile.username}</h1>
          {profile.name && (
            <p className="text-sm truncate" style={{ color: muted }}>{profile.name}</p>
          )}
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <p className="text-sm font-bold">{profile.followerCount}</p>
              <p className="text-xs" style={{ color: muted }}>Followers</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{profile.followingCount}</p>
              <p className="text-xs" style={{ color: muted }}>Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.8)" }}>{profile.bio}</p>
      )}

      {/* Social links */}
      {(profile.instagramUrl || profile.tiktokUrl) && (
        <div className="flex gap-3 mb-4">
          {profile.instagramUrl && (
            <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: "#8b88f8" }}>
              Instagram
            </a>
          )}
          {profile.tiktokUrl && (
            <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: "#8b88f8" }}>
              TikTok
            </a>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isOwnProfile ? (
        <div className="flex gap-2 mb-6">
          <Link
            href="/profile/edit"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          >
            <HiPencil className="w-4 h-4" />
            Edit Profile
          </Link>
          <Link
            href="/catalog"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          >
            My Catalog
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            <HiLogout className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleFollow}
          disabled={followLoading || hasRequested}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-6 disabled:opacity-60"
          style={
            isFollowing
              ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }
              : hasRequested
              ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }
              : { background: "linear-gradient(135deg, #6d6af5 0%, #8b88f8 100%)", boxShadow: "0 8px 24px rgba(109,106,245,0.3)", color: "#ffffff" }
          }
        >
          {isFollowing ? "Following" : hasRequested ? "Requested" : "Follow"}
        </button>
      )}

      {/* Follow requests (own profile only) */}
      {isOwnProfile && !requestsLoading && followRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Follow Requests ({followRequests.length})
          </h2>
          <div className="space-y-2">
            {followRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {req.sender.avatarUrl ? (
                  <img src={req.sender.avatarUrl} alt={req.sender.username} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-white text-sm font-bold">
                    {initials(req.sender.name)}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/profile/${req.sender.username}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-semibold text-sm truncate">{req.sender.username}</p>
                  {req.sender.name && (
                    <p className="text-xs truncate" style={{ color: muted }}>{req.sender.name}</p>
                  )}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="p-1.5 rounded-full btn-gradient text-white"
                    title="Accept"
                  >
                    <HiCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="p-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    title="Decline"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
        Recent Posts
      </h2>

      {posts.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: muted }}>No posts yet</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.GENERAL;
            return (
              <div
                key={post.id}
                className="p-3 rounded-xl"
                style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs" style={{ color: muted }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.caption && (
                  <p className="text-sm line-clamp-2" style={{ color: "rgba(255,255,255,0.8)" }}>{post.caption}</p>
                )}
                <div className="flex gap-3 mt-1.5 text-xs" style={{ color: muted }}>
                  <span>{post._count.likes} likes</span>
                  <span>{post._count.comments} comments</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

const TYPE_COLORS: Record<string, string> = {
  WORKOUT: "bg-[#fc4c02]/10 text-[#fc4c02]",
  MEAL: "bg-green-100 text-green-700",
  WELLNESS: "bg-purple-100 text-purple-700",
  GENERAL: "bg-gray-100 text-gray-600",
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

  // Load follow requests for own profile
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
          setProfile((p) =>
            p ? { ...p, followerCount: p.followerCount - 1 } : p
          );
        } else {
          if (profile.isPrivate) {
            setHasRequested(true);
          } else {
            setIsFollowing(true);
            setProfile((p) =>
              p ? { ...p, followerCount: p.followerCount + 1 } : p
            );
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
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-5">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
            {initials(profile.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{profile.username}</h1>
          {profile.name && (
            <p className="text-sm text-muted truncate">{profile.name}</p>
          )}
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{profile.followerCount}</p>
              <p className="text-xs text-muted">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{profile.followingCount}</p>
              <p className="text-xs text-muted">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">{profile.bio}</p>
      )}

      {/* Social links */}
      {(profile.instagramUrl || profile.tiktokUrl) && (
        <div className="flex gap-3 mb-4">
          {profile.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Instagram
            </a>
          )}
          {profile.tiktokUrl && (
            <a
              href={profile.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:border-gray-400 transition-colors"
          >
            <HiPencil className="w-4 h-4" />
            Edit Profile
          </Link>
          <Link
            href="/catalog"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:border-gray-400 transition-colors"
          >
            My Catalog
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-border text-sm font-medium text-muted hover:text-red-500 hover:border-red-300 transition-colors"
          >
            <HiLogout className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleFollow}
          disabled={followLoading || hasRequested}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors mb-6 ${
            isFollowing
              ? "border border-border text-foreground hover:border-red-300 hover:text-red-500"
              : hasRequested
              ? "bg-gray-200 text-muted cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          {isFollowing
            ? "Following"
            : hasRequested
            ? "Requested"
            : "Follow"}
        </button>
      )}

      {/* Follow requests (own profile only) */}
      {isOwnProfile && !requestsLoading && followRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Follow Requests ({followRequests.length})
          </h2>
          <div className="space-y-2">
            {followRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                {req.sender.avatarUrl ? (
                  <img
                    src={req.sender.avatarUrl}
                    alt={req.sender.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {initials(req.sender.name)}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/profile/${req.sender.username}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-semibold text-sm text-foreground truncate">
                    {req.sender.username}
                  </p>
                  {req.sender.name && (
                    <p className="text-xs text-muted truncate">{req.sender.name}</p>
                  )}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="p-1.5 rounded-full bg-primary text-white hover:bg-primary-dark"
                    title="Accept"
                  >
                    <HiCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="p-1.5 rounded-full bg-gray-200 text-muted hover:bg-gray-300"
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
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
        Recent Posts
      </h2>

      {posts.length === 0 ? (
        <p className="text-center text-muted text-sm py-8">No posts yet</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TYPE_COLORS[post.type] ?? TYPE_COLORS.GENERAL
                  }`}
                >
                  {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
                </span>
                <span className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              {post.caption && (
                <p className="text-sm text-foreground line-clamp-2">{post.caption}</p>
              )}
              <div className="flex gap-3 mt-1.5 text-xs text-muted">
                <span>{post._count.likes} likes</span>
                <span>{post._count.comments} comments</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

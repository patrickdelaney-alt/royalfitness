"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { HiLogout, HiPencil, HiCheck, HiX, HiUpload, HiArrowLeft, HiUserAdd } from "react-icons/hi";
import Link from "next/link";
import FollowListModal from "@/components/follow-list-modal";
import UserCatalogSection from "@/components/user-catalog-section";
import { lightImpact } from "@/lib/haptics";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";
import toast from "react-hot-toast";
import { FoundingMemberBadge } from "@/components/founding-member-badge";

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
  foundingMember: boolean;
}

interface PostSummary {
  id: string;
  type: string;
  caption: string | null;
  mediaUrl: string | null;
  visibility: string;
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
  WORKOUT: { bg: "rgba(36,63,22,0.10)", color: "#528531", label: "Workout" },
  MEAL: { bg: "rgba(154,123,46,0.15)", color: "#9A7B2E", label: "Meal" },
  WELLNESS: { bg: "rgba(82,133,49,0.15)", color: "#528531", label: "Wellness" },
  GENERAL: { bg: "rgba(36,63,22,0.10)", color: "var(--text-muted)", label: "General" },
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [activeSection, setActiveSection] = useState<"activity" | "catalog">("activity");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

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

  // Swipe-right-from-left-edge gesture for back navigation (mobile/Capacitor)
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (startX < 30 && dx > 60 && dy < dx * 0.6) {
        lightImpact();
        router.back();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [router]);

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
          lightImpact();
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

  const handleBlock = useCallback(async () => {
    if (!profile || blockLoading) return;
    setBlockLoading(true);
    try {
      const method = isBlocked ? "DELETE" : "POST";
      const res = await fetch("/api/social/block", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      if (res.ok) {
        setIsBlocked((v) => !v);
        if (!isBlocked) {
          setIsFollowing(false);
        }
      }
    } catch {
      // silent
    } finally {
      setBlockLoading(false);
    }
  }, [profile, isBlocked, blockLoading]);

  async function handleInvite() {
    if (!profile || inviteLoading) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/referral-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: "profile", sourceId: profile.id }),
      });
      const { url } = await res.json();
      if (navigator.share) {
        await navigator.share({ url, title: "Royal", text: "Join me on Royal" });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#528531", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p style={{ color: "var(--text-muted)" }}>User not found</p>
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium mx-auto"
            style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "var(--text-muted)" }}
          >
            <HiLogout className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>
    );
  }

  const muted = "var(--text-muted)";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "var(--text)" }}>
      {/* Back button — shown when viewing another user's profile */}
      {!isOwnProfile && (
        <button
          onClick={() => { lightImpact(); router.back(); }}
          className="flex items-center gap-1.5 mb-4 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <HiArrowLeft className="w-5 h-5" />
          Back
        </button>
      )}
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
          <h1 className="text-lg font-bold truncate flex items-center gap-1.5">
            {profile.username}
            {profile.foundingMember && <FoundingMemberBadge size="md" />}
          </h1>
          {profile.name && (
            <p className="text-sm truncate" style={{ color: muted }}>{profile.name}</p>
          )}
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setFollowModal("followers")}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <p className="text-sm font-bold">{profile.followerCount}</p>
              <p className="text-xs" style={{ color: muted }}>Followers</p>
            </button>
            <button
              onClick={() => setFollowModal("following")}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <p className="text-sm font-bold">{profile.followingCount}</p>
              <p className="text-xs" style={{ color: muted }}>Following</p>
            </button>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{profile.bio}</p>
      )}

      {/* Social links */}
      {(profile.instagramUrl || profile.tiktokUrl) && (
        <div className="flex gap-3 mb-4">
          {profile.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isCapacitorNative()) {
                  e.preventDefault();
                  openExternalLink(profile.instagramUrl!);
                }
              }}
              className="text-xs hover:underline"
              style={{ color: "var(--brand-light)" }}
            >
              Instagram
            </a>
          )}
          {profile.tiktokUrl && (
            <a
              href={profile.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isCapacitorNative()) {
                  e.preventDefault();
                  openExternalLink(profile.tiktokUrl!);
                }
              }}
              className="text-xs hover:underline"
              style={{ color: "var(--brand-light)" }}
            >
              TikTok
            </a>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isOwnProfile ? (
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex gap-2">
            <Link
              href="/profile/edit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "var(--text)" }}
            >
              <HiPencil className="w-4 h-4" />
              Edit Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "var(--text-muted)" }}
            >
              <HiLogout className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleInvite}
            disabled={inviteLoading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "var(--text)" }}
          >
            <HiUserAdd className="w-4 h-4" />
            Invite friends
          </button>
          <Link
            href="/catalog?upload=true"
            className="flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all btn-gradient"
            style={{ color: "#ffffff" }}
          >
            <HiUpload className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Upload Affiliate &amp; Discount Links</p>
              <p className="text-xs mt-0.5 opacity-80">Paste links, promo codes &amp; referrals in bulk</p>
            </div>
          </Link>
          <Link
            href="/achievements"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(36,63,22,0.10) 0%, rgba(82,133,49,0.10) 100%)",
              border: "1px solid rgba(82,133,49,0.25)",
              color: "var(--brand)",
            }}
          >
            🏅 My Badges
          </Link>
        </div>
      ) : (
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleFollow}
            disabled={followLoading || hasRequested || isBlocked}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={
              isBlocked
                ? { background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.06)", color: "var(--text-muted)" }
                : isFollowing
                ? { background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "var(--text)" }
                : hasRequested
                ? { background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.06)", color: "var(--text-muted)" }
                : { background: "var(--brand)", boxShadow: "0 0 40px rgba(36,63,22,0.15), 0 8px 24px rgba(24,25,15,0.09)", color: "#ffffff" }
            }
          >
            {isFollowing ? "Following" : hasRequested ? "Requested" : "Follow"}
          </button>
          <button
            onClick={handleBlock}
            disabled={blockLoading}
            className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: isBlocked ? "#f87171" : "var(--text-muted)" }}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      )}

      {/* Follow requests (own profile only) */}
      {isOwnProfile && !requestsLoading && followRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Follow Requests ({followRequests.length})
          </h2>
          <div className="space-y-2">
            {followRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
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
                    style={{ background: "rgba(36,63,22,0.10)", color: "var(--text-muted)" }}
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

      {/* Followers / Following modal */}
      <FollowListModal
        username={profile.username}
        type={followModal ?? "followers"}
        isOpen={followModal !== null}
        onClose={() => setFollowModal(null)}
      />

      {/* Section toggle */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "rgba(36,63,22,0.04)" }}>
        {(["activity", "catalog"] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              activeSection === section
                ? { background: "var(--brand)", color: "#ffffff" }
                : { background: "transparent", color: "var(--text-muted)" }
            }
          >
            {section === "activity" ? "Activity" : "Catalog"}
          </button>
        ))}
      </div>

      {/* Activity tab — horizontal list cards with thumbnail */}
      {activeSection === "activity" && (
        posts.length === 0 ? (
          <p className="text-center text-sm py-12" style={{ color: muted }}>No posts yet</p>
        ) : (
          <div className="space-y-2.5">
            {posts.map((post) => {
              const typeConfig: Record<string, { emoji: string; label: string; color: string; gradFrom: string; gradTo: string }> = {
                WORKOUT:  { emoji: "💪", label: "Workout",  color: "#f97316", gradFrom: "#1e3a5f", gradTo: "#1a2744" },
                MEAL:     { emoji: "🥗", label: "Meal",     color: "#22c55e", gradFrom: "#14532d", gradTo: "#122a1e" },
                WELLNESS: { emoji: "🧘", label: "Wellness", color: "#528531", gradFrom: "#2e1b5e", gradTo: "#1a1540" },
                GENERAL:  { emoji: "⭐", label: "General",  color: "var(--text-muted)", gradFrom: "#EFE9DE", gradTo: "#FDFAF5" },
              };
              const cfg = typeConfig[post.type] ?? typeConfig.GENERAL;
              const firstLine = post.caption?.split("\n")[0]?.trim() || `${cfg.label} post`;

              return (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="flex items-center gap-3 rounded-2xl active:opacity-70 transition-opacity"
                  style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.07)", padding: "10px 14px 10px 10px" }}
                >
                  {/* Square thumbnail */}
                  <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 64, height: 64 }}>
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${cfg.gradFrom}, ${cfg.gradTo})`, fontSize: 26 }}
                      >
                        {cfg.emoji}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: cfg.color }}>
                      {cfg.label}
                    </p>
                    <p className="text-sm font-semibold leading-snug line-clamp-1 mb-1" style={{ color: "var(--text)" }}>
                      {firstLine}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" · "}{post._count.likes} {post._count.likes === 1 ? "like" : "likes"}
                      {" · "}{post._count.comments} {post._count.comments === 1 ? "comment" : "comments"}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                    <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* Catalog tab */}
      {activeSection === "catalog" && (
        <UserCatalogSection username={profile.username} isOwnProfile={isOwnProfile} />
      )}
    </div>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EmbedMedia from "@/components/embed-media";

// ── data fetching ─────────────────────────────────────────────────────────────

async function getPublicPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      workoutDetail: {
        include: {
          exercises: { include: { sets: true }, orderBy: { sortOrder: "asc" } },
        },
      },
      mealDetail: true,
      wellnessDetail: true,
      externalContent: true,
      gym: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post || post.visibility !== "PUBLIC") return null;
  return post;
}

// ── OG metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);

  if (!post) {
    return { title: "Post not found · Royal Fitness" };
  }

  const author = post.author.name ?? post.author.username;
  const typeLabel =
    post.type === "WORKOUT"
      ? "workout"
      : post.type === "MEAL"
      ? "meal"
      : post.type === "WELLNESS"
      ? "wellness update"
      : "post";

  const title = `${author} logged a ${typeLabel} on Royal Fitness`;
  let description = post.caption ?? "";

  if (post.type === "WORKOUT" && post.workoutDetail) {
    const wd = post.workoutDetail;
    const parts: string[] = [];
    if (wd.workoutName) parts.push(wd.workoutName);
    if (wd.durationMinutes) parts.push(`${wd.durationMinutes} mins`);
    if (wd.exercises.length) parts.push(`${wd.exercises.length} exercises`);
    description = parts.join(" · ");
  } else if (post.type === "MEAL" && post.mealDetail) {
    const md = post.mealDetail;
    const parts: string[] = [];
    if (md.mealName) parts.push(md.mealName);
    if (md.calories) parts.push(`${md.calories} cal`);
    if (md.protein) parts.push(`${md.protein}g protein`);
    description = parts.join(" · ");
  } else if (post.type === "WELLNESS" && post.wellnessDetail) {
    const wd = post.wellnessDetail;
    const parts: string[] = [];
    if (wd.activityType) parts.push(wd.activityType);
    if (wd.durationMinutes) parts.push(`${wd.durationMinutes} mins`);
    description = parts.join(" · ");
  }

  const url = `https://royalwellness.app/p/${id}`;
  const image = post.mediaUrl ?? "https://royalwellness.app/og-default.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Royal Fitness",
      images: [{ url: image, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: post.mediaUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: post.mediaUrl ? [post.mediaUrl] : [],
    },
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const TYPE_BADGE: Record<string, { label: string; emoji: string; color: string }> = {
  WORKOUT: { label: "Workout", emoji: "💪", color: "#7875ff" },
  MEAL: { label: "Meal", emoji: "🥗", color: "#34d399" },
  WELLNESS: { label: "Wellness", emoji: "🧘", color: "#60a5fa" },
  GENERAL: { label: "Post", emoji: "📝", color: "#a78bfa" },
};

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPublicPost(id);

  if (!post) notFound();

  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.GENERAL;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-base"
          style={{ color: "#a8a6ff" }}
        >
          👑 Royal Fitness
        </Link>
        <Link
          href="/signin"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "linear-gradient(135deg,#7875ff,#a78bfa)", color: "#fff" }}
        >
          Sign in
        </Link>
      </header>

      {/* Post content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-32">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-4">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7875ff,#a78bfa)" }}
            >
              {initials(post.author.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "#fff" }}>
              {post.author.username}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {timeAgo(post.createdAt)}
              {post.gym ? ` · ${post.gym.name}` : ""}
            </p>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${badge.color}22`, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            {post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
              <video
                src={post.mediaUrl}
                controls
                className="w-full max-h-96 object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full max-h-96 object-cover"
              />
            )}
          </div>
        )}

        {post.externalContent[0] && <EmbedMedia item={post.externalContent[0]} />}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            {post.caption}
          </p>
        )}

        {/* Workout detail */}
        {post.type === "WORKOUT" && post.workoutDetail && (
          <div
            className="rounded-xl p-4 mb-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="font-semibold text-sm" style={{ color: "#fff" }}>
              {post.workoutDetail.workoutName}
            </p>
            {post.workoutDetail.durationMinutes && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                ⏱ {post.workoutDetail.durationMinutes} mins
              </p>
            )}
            {post.workoutDetail.exercises.map((ex) => (
              <div key={ex.id}>
                <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {ex.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ex.sets.map((s, i) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                    >
                      {i + 1}. {s.reps ? `${s.reps} reps` : ""}{s.weight ? ` · ${s.weight}${s.unit}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meal detail */}
        {post.type === "MEAL" && post.mealDetail && (
          <div
            className="rounded-xl p-4 mb-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="font-semibold text-sm" style={{ color: "#fff" }}>
              {post.mealDetail.mealName}
            </p>
            {(post.mealDetail.calories || post.mealDetail.protein) && (
              <div className="flex gap-4">
                {post.mealDetail.calories && (
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: "#fff" }}>{post.mealDetail.calories}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>cal</p>
                  </div>
                )}
                {post.mealDetail.protein && (
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: "#fff" }}>{post.mealDetail.protein}g</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>protein</p>
                  </div>
                )}
                {post.mealDetail.carbs && (
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: "#fff" }}>{post.mealDetail.carbs}g</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>carbs</p>
                  </div>
                )}
                {post.mealDetail.fat && (
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: "#fff" }}>{post.mealDetail.fat}g</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>fat</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Wellness detail */}
        {post.type === "WELLNESS" && post.wellnessDetail && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="font-semibold text-sm mb-1" style={{ color: "#fff" }}>
              {post.wellnessDetail.activityType}
            </p>
            {post.wellnessDetail.durationMinutes && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                ⏱ {post.wellnessDetail.durationMinutes} mins
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            ❤️ {post._count.likes}
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            💬 {post._count.comments}
          </span>
        </div>
      </main>

      {/* CTA banner */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 flex items-center gap-3"
        style={{
          background: "linear-gradient(to top, rgba(10,10,20,0.98) 0%, rgba(10,10,20,0.85) 100%)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
            Train with {post.author.name ?? post.author.username} 👑
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Join Royal Fitness — free forever
          </p>
        </div>
        <Link
          href="/signup"
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#7875ff,#a78bfa)", color: "#fff" }}
        >
          Join Free
        </Link>
      </div>
    </div>
  );
}

import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREAM = "#f5f2ec";
const GREEN = "#2d5a27";
const GOLD = "#c8a951";

const TYPE_BADGE: Record<string, { label: string; emoji: string }> = {
  WORKOUT: { label: "Workout", emoji: "💪" },
  MEAL: { label: "Meal", emoji: "🥗" },
  WELLNESS: { label: "Wellness", emoji: "🧘" },
  GENERAL: { label: "Post", emoji: "📝" },
};

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, username: true, avatarUrl: true } },
      workoutDetail: { include: { exercises: true } },
      mealDetail: true,
      wellnessDetail: true,
    },
  });
  if (!post || post.visibility !== "PUBLIC") return null;
  return post;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            background: CREAM,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: GREEN, fontSize: 48, fontWeight: 700 }}>
            Royal
          </span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const author = post.author.name ?? post.author.username;
  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.GENERAL;

  const postTitle =
    (post.type === "WORKOUT" ? post.workoutDetail?.workoutName : undefined) ??
    (post.type === "MEAL" ? post.mealDetail?.mealName : undefined) ??
    (post.type === "WELLNESS" ? post.wellnessDetail?.activityType : undefined) ??
    null;

  const details: string[] = [];
  if (post.type === "WORKOUT" && post.workoutDetail) {
    if (post.workoutDetail.durationMinutes)
      details.push(`${post.workoutDetail.durationMinutes} min`);
    if (post.workoutDetail.exercises.length)
      details.push(`${post.workoutDetail.exercises.length} exercises`);
  } else if (post.type === "MEAL" && post.mealDetail) {
    if (post.mealDetail.calories)
      details.push(`${post.mealDetail.calories} cal`);
    if (post.mealDetail.protein)
      details.push(`${post.mealDetail.protein}g protein`);
  } else if (post.type === "WELLNESS" && post.wellnessDetail) {
    if (post.wellnessDetail.durationMinutes)
      details.push(`${post.wellnessDetail.durationMinutes} min`);
    if (post.wellnessDetail.intensity)
      details.push(`intensity ${post.wellnessDetail.intensity}/10`);
  }

  const caption = post.caption
    ? post.caption.length > 120
      ? post.caption.slice(0, 117) + "…"
      : post.caption
    : null;

  const thumbUrl =
    post.mediaUrl && !post.mediaUrl.match(/\.(mp4|mov|webm)$/i)
      ? post.mediaUrl
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: CREAM,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: content column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "60px 56px",
            justifyContent: "space-between",
          }}
        >
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatarUrl}
                width={64}
                height={64}
                alt=""
                style={{ borderRadius: 32, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: GREEN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {author.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: GREEN, fontSize: 26, fontWeight: 700 }}>
                {author}
              </span>
              <span style={{ color: GOLD, fontSize: 20, fontWeight: 600 }}>
                {badge.emoji} {badge.label}
              </span>
            </div>
          </div>

          {/* Middle: title + details + caption */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              paddingTop: 32,
            }}
          >
            {postTitle && (
              <span
                style={{
                  color: GREEN,
                  fontSize: 42,
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                {postTitle}
              </span>
            )}
            {details.length > 0 && (
              <div style={{ display: "flex", gap: 16 }}>
                {details.map((d, i) => (
                  <span
                    key={i}
                    style={{
                      background: `${GREEN}18`,
                      color: GREEN,
                      fontSize: 22,
                      fontWeight: 600,
                      padding: "6px 18px",
                      borderRadius: 20,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
            {caption && (
              <span
                style={{
                  color: GREEN,
                  fontSize: 24,
                  opacity: 0.75,
                  lineHeight: 1.5,
                }}
              >
                {caption}
              </span>
            )}
          </div>

          {/* Royal wordmark */}
          <span
            style={{
              color: GOLD,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            ROYAL
          </span>
        </div>

        {/* Right: media thumbnail */}
        {thumbUrl && (
          <div style={{ width: 420, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

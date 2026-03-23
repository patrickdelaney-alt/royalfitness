import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema, CATALOG_ITEM_TYPES } from "@/lib/validations";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { parseEmbedUrl } from "@/lib/embed-parser";

// ── Catalog item snapshot resolver ────────────────────────────────────────────
// Looks up a catalog item by ID and type, verifies ownership, returns snapshot.
// Bypass prevention: keyed to item ID (not content) — edits cannot fool the guard.

interface CatalogSnapshot {
  title: string;
  brand: string | null;
  description: string | null;
  photoUrl: string | null;
  link: string | null;
  referralCode: string | null;
  category: string | null;
  ctaLabel: string | null;
}

async function resolveCatalogItemSnapshot(
  itemId: string,
  itemType: (typeof CATALOG_ITEM_TYPES)[number],
  userId: string
): Promise<CatalogSnapshot | null> {
  switch (itemType) {
    case "MEAL": {
      const item = await prisma.savedMeal.findFirst({
        where: { id: itemId, userId },
        select: { name: true, notes: true, photoUrl: true, recipeSourceUrl: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: null,
        description: item.notes ?? null,
        photoUrl: item.photoUrl ?? null,
        link: item.recipeSourceUrl ?? null,
        referralCode: null,
        category: "MEAL",
        ctaLabel: item.recipeSourceUrl ? "View Recipe" : null,
      };
    }
    case "WORKOUT": {
      const item = await prisma.savedWorkout.findFirst({
        where: { id: itemId, userId },
        select: { name: true, notes: true, videoUrl: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: null,
        description: item.notes ?? null,
        photoUrl: null,
        link: item.videoUrl ?? null,
        referralCode: null,
        category: "WORKOUT",
        ctaLabel: item.videoUrl ? "Watch Video" : null,
      };
    }
    case "SUPPLEMENT": {
      const item = await prisma.supplement.findFirst({
        where: { id: itemId, userId },
        select: { name: true, brand: true, notes: true, photoUrl: true, link: true, referralCode: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: item.brand ?? null,
        description: item.notes ?? null,
        photoUrl: item.photoUrl ?? null,
        link: item.link ?? null,
        referralCode: item.referralCode ?? null,
        category: "SUPPLEMENT",
        ctaLabel: item.link ? "Shop Now" : null,
      };
    }
    case "ACCESSORY": {
      const item = await prisma.wellnessAccessory.findFirst({
        where: { id: itemId, userId },
        select: { name: true, notes: true, photoUrl: true, link: true, referralCode: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: null,
        description: item.notes ?? null,
        photoUrl: item.photoUrl ?? null,
        link: item.link ?? null,
        referralCode: item.referralCode ?? null,
        category: "ACCESSORY",
        ctaLabel: item.link ? "Shop Now" : null,
      };
    }
    case "WELLNESS": {
      const item = await prisma.savedWellness.findFirst({
        where: { id: itemId, userId },
        select: { name: true, notes: true, photoUrl: true, link: true, referralCode: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: null,
        description: item.notes ?? null,
        photoUrl: item.photoUrl ?? null,
        link: item.link ?? null,
        referralCode: item.referralCode ?? null,
        category: "WELLNESS",
        ctaLabel: item.link ? "Learn More" : null,
      };
    }
    case "AFFILIATE": {
      const item = await prisma.affiliateItem.findFirst({
        where: { id: itemId, userId },
        select: {
          name: true, brand: true, description: true, photoUrl: true,
          link: true, referralCode: true, category: true, ctaLabel: true,
        },
      });
      if (!item) return null;
      return {
        title: item.name,
        brand: item.brand ?? null,
        description: item.description ?? null,
        photoUrl: item.photoUrl ?? null,
        link: item.link ?? null,
        referralCode: item.referralCode ?? null,
        category: item.category,
        ctaLabel: item.ctaLabel ?? (item.link ? "Shop Now" : null),
      };
    }
    default:
      return null;
  }
}

// GET /api/posts — Feed with cursor-based pagination and filters
export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    const userId = session?.user?.id;

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const type = searchParams.get("type") as "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL" | "CHECKIN" | "AFFILIATE" | "CATALOG_SHARE" | null;
    const gymId = searchParams.get("gymId") || undefined;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // Filter by post type
    if (type && ["WORKOUT", "MEAL", "WELLNESS", "GENERAL", "CHECKIN", "AFFILIATE", "CATALOG_SHARE"].includes(type)) {
      where.type = type;
    }

    // Filter by gym
    if (gymId) {
      where.gymId = gymId;
    }

    if (userId) {
      // Authenticated: show own posts + posts from followed users (respecting visibility)
      const followedUserIds = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = followedUserIds.map(
        (f: { followingId: string }) => f.followingId
      );

      // Get blocked user IDs (both directions)
      const blockedByMe = await prisma.blockedUser.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      });
      const blockedMe = await prisma.blockedUser.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      });
      const blockedIds = [
        ...blockedByMe.map((b: { blockedId: string }) => b.blockedId),
        ...blockedMe.map((b: { blockerId: string }) => b.blockerId),
      ];

      where.AND = [
        // Exclude blocked users
        ...(blockedIds.length > 0
          ? [{ authorId: { notIn: blockedIds } }]
          : []),
        // Visibility logic: own posts (any visibility) OR followed users' PUBLIC/FOLLOWERS posts OR any PUBLIC post
        {
          OR: [
            { authorId: userId },
            {
              authorId: { in: followingIds },
              visibility: { in: ["PUBLIC", "FOLLOWERS"] },
            },
            { visibility: "PUBLIC" },
          ],
        },
      ];
    } else {
      // Unauthenticated: only PUBLIC posts
      where.visibility = "PUBLIC";
    }

    const includeFields = {
      author: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      workoutDetail: {
        include: {
          exercises: {
            include: { sets: true },
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
      mealDetail: true,
      wellnessDetail: true,
      affiliateDetail: true,
      catalogShareDetail: true,
      gym: { select: { id: true, name: true } },
      externalContent: true,
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? { likes: { where: { userId }, select: { id: true } } }
        : {}),
    };

    const rawPosts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: includeFields,
    });

    let nextCursor: string | undefined;
    if (rawPosts.length > limit) {
      const nextItem = rawPosts.pop();
      nextCursor = nextItem?.id;
    }
    const posts = rawPosts;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      likedByMe: userId ? (post.likes?.length ?? 0) > 0 : false,
      likes: undefined, // Remove the raw likes array from the response
    }));

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts — Create a new post
export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const parsedEmbed = data.embed ? parseEmbedUrl(data.embed.url) : null;

    if (data.embed && !parsedEmbed) {
      return NextResponse.json(
        { error: "Unsupported or invalid embed URL" },
        { status: 400 }
      );
    }

    if (data.embed && parsedEmbed && data.embed.provider !== parsedEmbed.provider) {
      return NextResponse.json(
        { error: "Embed provider does not match URL" },
        { status: 400 }
      );
    }

    // Validate that the correct detail object is provided for the post type
    if (data.type === "WORKOUT" && !data.workout) {
      return NextResponse.json(
        { error: "Workout details are required for WORKOUT posts" },
        { status: 400 }
      );
    }
    if (data.type === "MEAL" && !data.meal) {
      return NextResponse.json(
        { error: "Meal details are required for MEAL posts" },
        { status: 400 }
      );
    }
    if (data.type === "WELLNESS" && !data.wellness) {
      return NextResponse.json(
        { error: "Wellness details are required for WELLNESS posts" },
        { status: 400 }
      );
    }
    if (data.type === "AFFILIATE" && !data.affiliate) {
      return NextResponse.json(
        { error: "Affiliate details are required for AFFILIATE posts" },
        { status: 400 }
      );
    }
    // CHECKIN posts require a gymId
    if (data.type === "CHECKIN" && !data.gymId) {
      return NextResponse.json(
        { error: "A gym is required for check-in posts" },
        { status: 400 }
      );
    }

    // CATALOG_SHARE posts require catalogShare fields
    if (data.type === "CATALOG_SHARE" && !data.catalogShare) {
      return NextResponse.json(
        { error: "Catalog item reference is required for catalog share posts" },
        { status: 400 }
      );
    }

    // ── Anti-spam check for CATALOG_SHARE ────────────────────────────────────
    // Current rule: one share per user per catalog item per UTC calendar day.
    // This check happens BEFORE the transaction so we can return early cleanly.
    //
    // To change to rolling 24-hour window:
    //   Replace sharedDate: todayUTC with createdAt: { gte: new Date(Date.now() - 86_400_000) }
    //
    // The guard is keyed to catalogItemId (the item's DB id), not its content,
    // so tiny edits to the catalog item cannot bypass this rule.
    let catalogSnapshot: Awaited<ReturnType<typeof resolveCatalogItemSnapshot>> = null;
    let todayUTC: Date | null = null;

    if (data.type === "CATALOG_SHARE" && data.catalogShare) {
      const { catalogItemId, catalogItemType } = data.catalogShare;

      todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);

      const existingShare = await prisma.catalogShareCooldown.findFirst({
        where: { userId, catalogItemId, catalogItemType, sharedDate: todayUTC },
      });

      if (existingShare) {
        return NextResponse.json(
          {
            error: "You've already shared this item today. Come back tomorrow to share it again.",
            code: "ALREADY_SHARED_TODAY",
          },
          { status: 409 }
        );
      }

      // Look up catalog item and build immutable snapshot
      catalogSnapshot = await resolveCatalogItemSnapshot(catalogItemId, catalogItemType, userId);
      if (!catalogSnapshot) {
        return NextResponse.json(
          { error: "Catalog item not found or does not belong to you" },
          { status: 404 }
        );
      }
    }

    // Verify gym exists if gymId is provided
    if (data.gymId) {
      const gym = await prisma.gym.findUnique({ where: { id: data.gymId } });
      if (!gym) {
        return NextResponse.json(
          { error: "Gym not found" },
          { status: 404 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const post = await prisma.$transaction(async (tx: any) => {
      // Create the base post (support backdating via postDate)
      const createdAt = data.postDate ? new Date(data.postDate) : undefined;
      const newPost = await tx.post.create({
        data: {
          type: data.type,
          caption: data.caption,
          visibility: data.visibility,
          tags: data.tags,
          mediaUrl: data.mediaUrl,
          authorId: userId,
          gymId: data.gymId,
          ...(createdAt && !isNaN(createdAt.getTime()) ? { createdAt } : {}),
        },
      });

      // Create polymorphic detail based on type
      if (data.type === "WORKOUT" && data.workout) {
        await tx.workoutDetail.create({
          data: {
            postId: newPost.id,
            workoutName: data.workout.workoutName,
            isClass: data.workout.isClass,
            muscleGroups: data.workout.muscleGroups,
            durationMinutes: data.workout.durationMinutes,
            perceivedExertion: data.workout.perceivedExertion,
            moodAfter: data.workout.moodAfter,
            notes: data.workout.notes,
            postTiming: data.workout.postTiming,
            exercises: {
              create: data.workout.exercises.map((exercise, exerciseIndex) => ({
                name: exercise.name,
                sortOrder: exerciseIndex,
                sets: {
                  create: exercise.sets.map((set, setIndex) => ({
                    reps: set.reps,
                    weight: set.weight,
                    unit: set.unit,
                    rpe: set.rpe,
                    sortOrder: setIndex,
                  })),
                },
              })),
            },
          },
        });
      }

      if (data.type === "MEAL" && data.meal) {
        await tx.mealDetail.create({
          data: {
            postId: newPost.id,
            mealName: data.meal.mealName,
            mealType: data.meal.mealType,
            ingredients: data.meal.ingredients,
            calories: data.meal.calories,
            protein: data.meal.protein,
            carbs: data.meal.carbs,
            fat: data.meal.fat,
            recipeSourceUrl: data.meal.recipeSourceUrl || null,
          },
        });

        // If saveToCatalog is true, also create a SavedMeal
        if (data.meal.saveToCatalog) {
          await tx.savedMeal.create({
            data: {
              userId,
              name: data.meal.mealName,
              ingredients: data.meal.ingredients,
              calories: data.meal.calories,
              protein: data.meal.protein,
              carbs: data.meal.carbs,
              fat: data.meal.fat,
              recipeSourceUrl: data.meal.recipeSourceUrl || null,
              photoUrl: data.mediaUrl || null,
              tags: data.tags,
            },
          });
        }
      }

      if (data.type === "WELLNESS" && data.wellness) {
        await tx.wellnessDetail.create({
          data: {
            postId: newPost.id,
            activityType: data.wellness.activityType,
            durationMinutes: data.wellness.durationMinutes,
            intensity: data.wellness.intensity,
            moodAfter: data.wellness.moodAfter,
            notes: data.wellness.notes,
          },
        });
      }

      if (data.type === "AFFILIATE" && data.affiliate) {
        await tx.affiliateDetail.create({
          data: {
            postId: newPost.id,
            affiliateItemId: data.affiliate.affiliateItemId || null,
            title: data.affiliate.title,
            brand: data.affiliate.brand || null,
            link: data.affiliate.link || null,
            referralCode: data.affiliate.referralCode || null,
            category: data.affiliate.category,
          },
        });
      }

      // Create catalog share detail + anti-spam guard (atomic with post creation)
      if (data.type === "CATALOG_SHARE" && data.catalogShare && catalogSnapshot && todayUTC) {
        await tx.catalogShareDetail.create({
          data: {
            postId: newPost.id,
            catalogItemId: data.catalogShare.catalogItemId,
            catalogItemType: data.catalogShare.catalogItemType,
            title: catalogSnapshot.title,
            brand: catalogSnapshot.brand,
            description: catalogSnapshot.description,
            photoUrl: catalogSnapshot.photoUrl,
            link: catalogSnapshot.link,
            referralCode: catalogSnapshot.referralCode,
            category: catalogSnapshot.category,
            ctaLabel: catalogSnapshot.ctaLabel,
          },
        });

        // Write the anti-spam guard inside the same transaction.
        // If the post creation fails for any reason, this record is also rolled back,
        // ensuring the user is never incorrectly blocked from sharing again today.
        await tx.catalogShareCooldown.create({
          data: {
            userId,
            catalogItemId: data.catalogShare.catalogItemId,
            catalogItemType: data.catalogShare.catalogItemType,
            sharedDate: todayUTC,
          },
        });
      }

      // Create external content if URL is provided
      if (data.embed && parsedEmbed) {
        await tx.externalContent.create({
          data: {
            postId: newPost.id,
            url: parsedEmbed.url,
            title: data.embed.title,
            imageUrl: data.embed.thumbnailUrl,
            siteName:
              parsedEmbed.provider === "youtube"
                ? "YouTube"
                : parsedEmbed.provider === "instagram"
                ? "Instagram"
                : "TikTok",
            description: `embed:${parsedEmbed.provider}:${parsedEmbed.contentId}`,
          },
        });
      } else if (data.externalUrl && data.externalUrl !== "") {
        await tx.externalContent.create({
          data: {
            postId: newPost.id,
            url: data.externalUrl,
          },
        });
      }

      // Re-fetch the complete post with all relations
      return tx.post.findUniqueOrThrow({
        where: { id: newPost.id },
        include: {
          author: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          workoutDetail: {
            include: {
              exercises: {
                include: { sets: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          mealDetail: true,
          wellnessDetail: true,
          affiliateDetail: true,
          catalogShareDetail: true,
          gym: { select: { id: true, name: true } },
          externalContent: true,
          _count: { select: { likes: true, comments: true } },
        },
      });
    });

    // Fire-and-forget: check and award achievements (check-ins don't earn badges)
    if (data.type !== "CHECKIN") {
      checkAndAwardAchievements(userId, prisma).catch(() => {});
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

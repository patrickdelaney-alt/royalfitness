import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations";
import { checkAndAwardAchievements } from "@/lib/achievements";

// GET /api/posts — Feed with cursor-based pagination and filters
export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    const userId = session?.user?.id;

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const type = searchParams.get("type") as "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL" | null;
    const gymId = searchParams.get("gymId") || undefined;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // Filter by post type
    if (type && ["WORKOUT", "MEAL", "WELLNESS", "GENERAL"].includes(type)) {
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
      gym: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? { likes: { where: { userId }, select: { id: true } } }
        : {}),
    };

    // Ranked first page: when no cursor, fetch recent posts and score by engagement
    let posts;
    let nextCursor: string | undefined;

    if (!cursor) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const rankedWhere = { ...where, createdAt: { gte: fourteenDaysAgo } };
      const candidates = await prisma.post.findMany({
        where: rankedWhere,
        take: 100,
        orderBy: { createdAt: "desc" },
        include: includeFields,
      });

      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored = candidates.map((p: any) => {
        const hoursAgo = (now - new Date(p.createdAt).getTime()) / 3_600_000;
        const score =
          (p._count.likes * 2) +
          (p._count.comments * 3) +
          Math.max(0, 14 - hoursAgo / 24);
        return { ...p, _score: score };
      });
      scored.sort((a: { _score: number }, b: { _score: number }) => b._score - a._score);
      posts = scored.slice(0, limit);
      // No nextCursor for ranked page — infinite scroll falls back to chronological
    } else {
      const rawPosts = await prisma.post.findMany({
        where,
        take: limit + 1,
        cursor: { id: cursor },
        skip: 1,
        orderBy: { createdAt: "desc" },
        include: includeFields,
      });

      if (rawPosts.length > limit) {
        const nextItem = rawPosts.pop();
        nextCursor = nextItem?.id;
      }
      posts = rawPosts;
    }

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

      // Create external content if URL is provided
      if (data.externalUrl && data.externalUrl !== "") {
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
          gym: { select: { id: true, name: true } },
          externalContent: true,
          _count: { select: { likes: true, comments: true } },
        },
      });
    });

    // Fire-and-forget: check and award achievements without blocking the response
    checkAndAwardAchievements(userId, prisma).catch(() => {});

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

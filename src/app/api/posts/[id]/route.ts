import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations";
import { parseEmbedUrl } from "@/lib/embed-parser";

// GET /api/posts/[id] — Get a single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
    const userId = session?.user?.id;

    const post = await prisma.post.findUnique({
      where: { id },
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
        gym: { select: { id: true, name: true } },
        externalContent: true,
        _count: { select: { likes: true, comments: true } },
        ...(userId
          ? { likes: { where: { userId }, select: { id: true } } }
          : {}),
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility permissions
    if (post.visibility === "PRIVATE" && post.authorId !== userId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.visibility === "FOLLOWERS" && post.authorId !== userId) {
      if (!userId) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: post.authorId,
          },
        },
      });
      if (!isFollowing) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    // Check if the viewer is blocked by the author or vice versa
    if (userId && userId !== post.authorId) {
      const blocked = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: post.authorId, blockedId: userId },
            { blockerId: userId, blockedId: post.authorId },
          ],
        },
      });
      if (blocked) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    const likes =
      "likes" in post
        ? (post as typeof post & { likes: { id: string }[] }).likes
        : [];
    const responsePost = {
      ...post,
      likedByMe: likes.length > 0,
      likes: undefined,
    };

    return NextResponse.json(responsePost);
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] — Edit a post (author only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        authorId: true,
        type: true,
        mediaUrl: true,
        tags: true,
        mealDetail: {
          select: {
            mealName: true,
            ingredients: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            recipeSourceUrl: true,
            saveToCatalog: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createPostSchema
      .omit({ type: true, postDate: true, tags: true, affiliate: true })
      .partial()
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.gymId) {
      const gym = await prisma.gym.findUnique({ where: { id: data.gymId } });
      if (!gym) {
        return NextResponse.json({ error: "Gym not found" }, { status: 404 });
      }
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      await tx.post.update({
        where: { id },
        data: {
          ...(data.caption !== undefined ? { caption: data.caption || null } : {}),
          ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
          ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl || null } : {}),
          ...(data.gymId !== undefined ? { gymId: data.gymId || null } : {}),
        },
      });

      if (post.type === "WORKOUT" && data.workout) {
        await tx.workoutDetail.update({
          where: { postId: id },
          data: {
            workoutName: data.workout.workoutName,
            isClass: data.workout.isClass,
            muscleGroups: data.workout.muscleGroups,
            durationMinutes: data.workout.durationMinutes,
            perceivedExertion: data.workout.perceivedExertion,
            moodAfter: data.workout.moodAfter,
            notes: data.workout.notes,
            postTiming: data.workout.postTiming,
            exercises: {
              deleteMany: {},
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

      if (post.type === "MEAL" && data.meal) {
        const previousSaveToCatalog = post.mealDetail?.saveToCatalog ?? false;
        const nextSaveToCatalog = data.meal.saveToCatalog;

        await tx.mealDetail.update({
          where: { postId: id },
          data: {
            mealName: data.meal.mealName,
            mealType: data.meal.mealType,
            ingredients: data.meal.ingredients,
            calories: data.meal.calories,
            protein: data.meal.protein,
            carbs: data.meal.carbs,
            fat: data.meal.fat,
            recipeSourceUrl: data.meal.recipeSourceUrl || null,
            saveToCatalog: data.meal.saveToCatalog,
          },
        });

        if (!previousSaveToCatalog && nextSaveToCatalog) {
          const existingSavedMeal = await tx.savedMeal.findFirst({
            where: {
              userId,
              name: data.meal.mealName,
              ingredients: data.meal.ingredients,
              calories: data.meal.calories,
              protein: data.meal.protein,
              carbs: data.meal.carbs,
              fat: data.meal.fat,
              recipeSourceUrl: data.meal.recipeSourceUrl || null,
              photoUrl: data.mediaUrl ?? post.mediaUrl ?? null,
              tags: post.tags,
            },
            select: { id: true },
          });

          if (!existingSavedMeal) {
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
                photoUrl: data.mediaUrl ?? post.mediaUrl ?? null,
                tags: post.tags,
              },
            });
          }
        } else if (previousSaveToCatalog && !nextSaveToCatalog) {
          await tx.savedMeal.deleteMany({
            where: {
              userId,
              name: post.mealDetail?.mealName,
              ingredients: post.mealDetail?.ingredients,
              calories: post.mealDetail?.calories,
              protein: post.mealDetail?.protein,
              carbs: post.mealDetail?.carbs,
              fat: post.mealDetail?.fat,
              recipeSourceUrl: post.mealDetail?.recipeSourceUrl || null,
              photoUrl: post.mediaUrl ?? null,
              tags: post.tags,
            },
          });
        }
      }

      if (post.type === "WELLNESS" && data.wellness) {
        await tx.wellnessDetail.update({
          where: { postId: id },
          data: {
            activityType: data.wellness.activityType,
            durationMinutes: data.wellness.durationMinutes,
            intensity: data.wellness.intensity,
            moodAfter: data.wellness.moodAfter,
            notes: data.wellness.notes,
          },
        });
      }

      if (data.embed) {
        await tx.externalContent.deleteMany({ where: { postId: id } });
        if (parsedEmbed) {
          await tx.externalContent.create({
            data: {
              postId: id,
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
        }
      } else if (data.externalUrl !== undefined) {
        await tx.externalContent.deleteMany({ where: { postId: id } });
        if (data.externalUrl) {
          await tx.externalContent.create({
            data: {
              postId: id,
              url: data.externalUrl,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] — Delete a post (author only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

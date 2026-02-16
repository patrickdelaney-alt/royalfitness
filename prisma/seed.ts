import { PrismaClient, PostType, Visibility, PostTiming, GymRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.exerciseSet.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutDetail.deleteMany();
  await prisma.mealDetail.deleteMany();
  await prisma.wellnessDetail.deleteMany();
  await prisma.externalContent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.followRequest.deleteMany();
  await prisma.gymMembership.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.savedMeal.deleteMany();
  await prisma.savedWorkout.deleteMany();
  await prisma.supplement.deleteMany();
  await prisma.wellnessAccessory.deleteMany();
  await prisma.stepsEntry.deleteMany();
  await prisma.report.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 12);

  // Users
  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      username: "alice",
      email: "alice@example.com",
      passwordHash: hash,
      bio: "Fitness enthusiast. Lifting heavy, eating clean.",
      instagramUrl: "https://instagram.com/alicefitness",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      username: "bob",
      email: "bob@example.com",
      passwordHash: hash,
      bio: "Yoga + weights. Balance is everything.",
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol Martinez",
      username: "carol",
      email: "carol@example.com",
      passwordHash: hash,
      bio: "Meal prep queen. Wellness warrior.",
      isPrivate: true,
    },
  });

  const dave = await prisma.user.create({
    data: {
      name: "Dave Chen",
      username: "dave",
      email: "dave@example.com",
      passwordHash: hash,
      bio: "CrossFit and cold plunges.",
      tiktokUrl: "https://tiktok.com/@davefitness",
    },
  });

  const eve = await prisma.user.create({
    data: {
      name: "Eve Wilson",
      username: "eve",
      email: "eve@example.com",
      passwordHash: hash,
      bio: "Runner turned lifter. Breathwork newbie.",
    },
  });

  // Follows
  const followPairs = [
    [alice.id, bob.id],
    [alice.id, dave.id],
    [alice.id, eve.id],
    [bob.id, alice.id],
    [bob.id, carol.id],
    [bob.id, dave.id],
    [dave.id, alice.id],
    [dave.id, bob.id],
    [dave.id, eve.id],
    [eve.id, alice.id],
    [eve.id, bob.id],
  ];

  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  // Follow request to private carol
  await prisma.followRequest.create({
    data: { senderId: alice.id, targetId: carol.id },
  });

  // Gyms
  const ironTemple = await prisma.gym.create({
    data: {
      name: "Iron Temple",
      address: "123 Main St, Anytown",
    },
  });

  const zenStudio = await prisma.gym.create({
    data: {
      name: "Zen Yoga Studio",
      address: "456 Oak Ave, Anytown",
    },
  });

  const crossfitBox = await prisma.gym.create({
    data: {
      name: "CrossFit Forge",
      address: "789 Industrial Blvd",
    },
  });

  // Gym memberships
  await prisma.gymMembership.createMany({
    data: [
      { userId: alice.id, gymId: ironTemple.id, role: GymRole.ADMIN },
      { userId: bob.id, gymId: ironTemple.id },
      { userId: bob.id, gymId: zenStudio.id, role: GymRole.ADMIN },
      { userId: dave.id, gymId: crossfitBox.id, role: GymRole.ADMIN },
      { userId: dave.id, gymId: ironTemple.id },
      { userId: eve.id, gymId: ironTemple.id },
      { userId: eve.id, gymId: zenStudio.id },
    ],
  });

  // ─── POSTS ────────────────────────────────────────────────────

  // Alice's workout post
  const aliceWorkout = await prisma.post.create({
    data: {
      type: PostType.WORKOUT,
      caption: "Leg day done! Feeling strong today 💪",
      visibility: Visibility.PUBLIC,
      tags: ["legs", "strength", "squat"],
      authorId: alice.id,
      gymId: ironTemple.id,
      createdAt: daysAgo(0),
    },
  });

  await prisma.workoutDetail.create({
    data: {
      postId: aliceWorkout.id,
      workoutName: "Leg Day",
      durationMinutes: 75,
      perceivedExertion: 8,
      moodAfter: 9,
      postTiming: PostTiming.AFTER,
      notes: "New PR on squats!",
      exercises: {
        create: [
          {
            name: "Barbell Squat",
            sortOrder: 0,
            sets: {
              create: [
                { reps: 5, weight: 225, unit: "lbs", sortOrder: 0 },
                { reps: 5, weight: 245, unit: "lbs", sortOrder: 1 },
                { reps: 3, weight: 265, unit: "lbs", rpe: 9, sortOrder: 2 },
              ],
            },
          },
          {
            name: "Romanian Deadlift",
            sortOrder: 1,
            sets: {
              create: [
                { reps: 10, weight: 135, unit: "lbs", sortOrder: 0 },
                { reps: 10, weight: 155, unit: "lbs", sortOrder: 1 },
                { reps: 8, weight: 175, unit: "lbs", sortOrder: 2 },
              ],
            },
          },
          {
            name: "Leg Press",
            sortOrder: 2,
            sets: {
              create: [
                { reps: 12, weight: 360, unit: "lbs", sortOrder: 0 },
                { reps: 10, weight: 450, unit: "lbs", sortOrder: 1 },
              ],
            },
          },
          {
            name: "Walking Lunges",
            sortOrder: 3,
            sets: {
              create: [
                { reps: 20, weight: 50, unit: "lbs", sortOrder: 0 },
                { reps: 20, weight: 50, unit: "lbs", sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // Bob's workout
  const bobWorkout = await prisma.post.create({
    data: {
      type: PostType.WORKOUT,
      caption: "Push day with some yoga stretches after",
      visibility: Visibility.PUBLIC,
      tags: ["push", "chest", "yoga"],
      authorId: bob.id,
      gymId: ironTemple.id,
      createdAt: daysAgo(1),
    },
  });

  await prisma.workoutDetail.create({
    data: {
      postId: bobWorkout.id,
      workoutName: "Push + Yoga",
      isClass: false,
      durationMinutes: 90,
      perceivedExertion: 7,
      moodAfter: 8,
      postTiming: PostTiming.AFTER,
      exercises: {
        create: [
          {
            name: "Bench Press",
            sortOrder: 0,
            sets: {
              create: [
                { reps: 8, weight: 185, unit: "lbs", sortOrder: 0 },
                { reps: 8, weight: 185, unit: "lbs", sortOrder: 1 },
                { reps: 6, weight: 195, unit: "lbs", rpe: 8, sortOrder: 2 },
              ],
            },
          },
          {
            name: "Overhead Press",
            sortOrder: 1,
            sets: {
              create: [
                { reps: 10, weight: 95, unit: "lbs", sortOrder: 0 },
                { reps: 8, weight: 105, unit: "lbs", sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // Alice's meal post
  const aliceMeal = await prisma.post.create({
    data: {
      type: PostType.MEAL,
      caption: "Post-workout protein bowl. Simple and effective.",
      visibility: Visibility.PUBLIC,
      tags: ["high-protein", "post-workout"],
      authorId: alice.id,
      createdAt: daysAgo(0),
    },
  });

  await prisma.mealDetail.create({
    data: {
      postId: aliceMeal.id,
      mealName: "Chicken & Rice Power Bowl",
      mealType: "lunch",
      ingredients: [
        "Grilled chicken breast",
        "Brown rice",
        "Broccoli",
        "Avocado",
        "Soy sauce",
      ],
      calories: 650,
      protein: 45,
      carbs: 60,
      fat: 22,
      saveToCatalog: true,
    },
  });

  // Save to catalog
  await prisma.savedMeal.create({
    data: {
      userId: alice.id,
      name: "Chicken & Rice Power Bowl",
      ingredients: [
        "Grilled chicken breast",
        "Brown rice",
        "Broccoli",
        "Avocado",
        "Soy sauce",
      ],
      calories: 650,
      protein: 45,
      carbs: 60,
      fat: 22,
      tags: ["high-protein", "post-workout"],
    },
  });

  // Dave's meal
  const daveMeal = await prisma.post.create({
    data: {
      type: PostType.MEAL,
      caption: "Overnight oats prep for the week. 5 jars ready to go.",
      visibility: Visibility.PUBLIC,
      tags: ["meal-prep", "breakfast"],
      authorId: dave.id,
      createdAt: daysAgo(2),
    },
  });

  await prisma.mealDetail.create({
    data: {
      postId: daveMeal.id,
      mealName: "Protein Overnight Oats",
      mealType: "breakfast",
      ingredients: [
        "Rolled oats",
        "Greek yogurt",
        "Protein powder",
        "Almond milk",
        "Chia seeds",
        "Blueberries",
      ],
      calories: 420,
      protein: 35,
      carbs: 48,
      fat: 12,
    },
  });

  // Bob's wellness post
  const bobWellness = await prisma.post.create({
    data: {
      type: PostType.WELLNESS,
      caption: "Morning breathwork session. 20 minutes of Wim Hof method.",
      visibility: Visibility.PUBLIC,
      tags: ["breathwork", "morning-routine"],
      authorId: bob.id,
      createdAt: daysAgo(0),
    },
  });

  await prisma.wellnessDetail.create({
    data: {
      postId: bobWellness.id,
      activityType: "breathwork",
      durationMinutes: 20,
      intensity: 6,
      moodAfter: 9,
      notes: "3 rounds of WHM. Held breath for 2:30 on last round.",
    },
  });

  // Dave's wellness
  const daveWellness = await prisma.post.create({
    data: {
      type: PostType.WELLNESS,
      caption: "Cold plunge after WOD. 3 minutes at 39°F.",
      visibility: Visibility.PUBLIC,
      tags: ["cold-plunge", "recovery"],
      authorId: dave.id,
      gymId: crossfitBox.id,
      createdAt: daysAgo(1),
    },
  });

  await prisma.wellnessDetail.create({
    data: {
      postId: daveWellness.id,
      activityType: "cold_plunge",
      durationMinutes: 3,
      intensity: 9,
      moodAfter: 10,
      notes: "39°F. Feels amazing after.",
    },
  });

  // Eve's wellness
  const eveWellness = await prisma.post.create({
    data: {
      type: PostType.WELLNESS,
      caption: "Sauna session to end the week. 30 mins of pure relaxation.",
      visibility: Visibility.PUBLIC,
      tags: ["sauna", "recovery", "relaxation"],
      authorId: eve.id,
      createdAt: daysAgo(0),
    },
  });

  await prisma.wellnessDetail.create({
    data: {
      postId: eveWellness.id,
      activityType: "sauna",
      durationMinutes: 30,
      intensity: 4,
      moodAfter: 9,
    },
  });

  // General post
  await prisma.post.create({
    data: {
      type: PostType.GENERAL,
      caption:
        "New gym bag arrived! Ready for another week of gains. What's everyone training today?",
      visibility: Visibility.PUBLIC,
      tags: ["motivation"],
      authorId: eve.id,
      createdAt: daysAgo(3),
    },
  });

  // Dave's workout at CrossFit
  const daveWorkout = await prisma.post.create({
    data: {
      type: PostType.WORKOUT,
      caption: "WOD: Fran. 3:42. New PR!",
      visibility: Visibility.PUBLIC,
      tags: ["crossfit", "wod", "pr"],
      authorId: dave.id,
      gymId: crossfitBox.id,
      createdAt: daysAgo(0),
    },
  });

  await prisma.workoutDetail.create({
    data: {
      postId: daveWorkout.id,
      workoutName: "Fran",
      isClass: true,
      durationMinutes: 4,
      perceivedExertion: 10,
      moodAfter: 8,
      postTiming: PostTiming.AFTER,
      notes: "21-15-9 Thrusters and Pull-ups",
      exercises: {
        create: [
          {
            name: "Thrusters",
            sortOrder: 0,
            sets: {
              create: [
                { reps: 21, weight: 95, unit: "lbs", sortOrder: 0 },
                { reps: 15, weight: 95, unit: "lbs", sortOrder: 1 },
                { reps: 9, weight: 95, unit: "lbs", sortOrder: 2 },
              ],
            },
          },
          {
            name: "Pull-ups",
            sortOrder: 1,
            sets: {
              create: [
                { reps: 21, sortOrder: 0 },
                { reps: 15, sortOrder: 1 },
                { reps: 9, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // Eve's workout
  const eveWorkout = await prisma.post.create({
    data: {
      type: PostType.WORKOUT,
      caption: "Full body session. Keeping it balanced.",
      visibility: Visibility.PUBLIC,
      tags: ["full-body", "strength"],
      authorId: eve.id,
      gymId: ironTemple.id,
      createdAt: daysAgo(1),
    },
  });

  await prisma.workoutDetail.create({
    data: {
      postId: eveWorkout.id,
      workoutName: "Full Body",
      durationMinutes: 60,
      perceivedExertion: 7,
      moodAfter: 8,
      postTiming: PostTiming.AFTER,
      exercises: {
        create: [
          {
            name: "Deadlift",
            sortOrder: 0,
            sets: {
              create: [
                { reps: 5, weight: 185, unit: "lbs", sortOrder: 0 },
                { reps: 5, weight: 205, unit: "lbs", sortOrder: 1 },
                { reps: 3, weight: 225, unit: "lbs", rpe: 8, sortOrder: 2 },
              ],
            },
          },
          {
            name: "Dumbbell Press",
            sortOrder: 1,
            sets: {
              create: [
                { reps: 10, weight: 50, unit: "lbs", sortOrder: 0 },
                { reps: 10, weight: 55, unit: "lbs", sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // ─── INTERACTIONS ──────────────────────────────────────────────

  // Likes
  const allPosts = [
    aliceWorkout, bobWorkout, aliceMeal, daveMeal,
    bobWellness, daveWellness, eveWellness, daveWorkout, eveWorkout,
  ];
  const allUsers = [alice, bob, dave, eve];

  for (const post of allPosts) {
    // Random subset of users likes each post
    const likers = allUsers.filter(() => Math.random() > 0.4);
    for (const user of likers) {
      if (user.id !== post.authorId) {
        await prisma.like.create({
          data: { userId: user.id, postId: post.id },
        }).catch(() => {}); // ignore duplicates
      }
    }
  }

  // Comments
  await prisma.comment.create({
    data: {
      text: "Great numbers! That squat PR is impressive.",
      authorId: bob.id,
      postId: aliceWorkout.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "Legs looking strong!",
      authorId: dave.id,
      postId: aliceWorkout.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "That bowl looks delicious. Saving this recipe!",
      authorId: eve.id,
      postId: aliceMeal.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "Fran under 4 mins is elite. Well done!",
      authorId: alice.id,
      postId: daveWorkout.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "I need to try WHM. Any tips for beginners?",
      authorId: eve.id,
      postId: bobWellness.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "Start with just 1 round and work your way up!",
      authorId: bob.id,
      postId: bobWellness.id,
    },
  });

  // ─── CATALOG ITEMS ────────────────────────────────────────────

  // Saved workouts
  await prisma.savedWorkout.create({
    data: {
      userId: alice.id,
      name: "Leg Day Template",
      exercisesJson: JSON.stringify([
        { name: "Barbell Squat", sets: [{ reps: 5, weight: 225 }, { reps: 5, weight: 245 }] },
        { name: "Romanian Deadlift", sets: [{ reps: 10, weight: 135 }, { reps: 10, weight: 155 }] },
        { name: "Leg Press", sets: [{ reps: 12, weight: 360 }] },
        { name: "Walking Lunges", sets: [{ reps: 20, weight: 50 }] },
      ]),
      tags: ["legs", "strength"],
    },
  });

  await prisma.savedWorkout.create({
    data: {
      userId: bob.id,
      name: "Push Day Template",
      exercisesJson: JSON.stringify([
        { name: "Bench Press", sets: [{ reps: 8, weight: 185 }] },
        { name: "Overhead Press", sets: [{ reps: 10, weight: 95 }] },
        { name: "Dumbbell Flyes", sets: [{ reps: 12, weight: 30 }] },
      ]),
      tags: ["push", "chest"],
    },
  });

  // Supplements
  await prisma.supplement.create({
    data: {
      userId: alice.id,
      name: "Whey Protein Isolate",
      brand: "Optimum Nutrition",
      dose: "1 scoop (30g)",
      schedule: "Post-workout",
      tags: ["protein", "recovery"],
    },
  });
  await prisma.supplement.create({
    data: {
      userId: alice.id,
      name: "Creatine Monohydrate",
      brand: "Thorne",
      dose: "5g daily",
      schedule: "Morning with water",
      tags: ["creatine", "strength"],
    },
  });
  await prisma.supplement.create({
    data: {
      userId: dave.id,
      name: "Fish Oil",
      brand: "Nordic Naturals",
      dose: "2 capsules",
      schedule: "With breakfast",
      tags: ["omega-3", "recovery"],
    },
  });

  // Wellness accessories
  await prisma.wellnessAccessory.create({
    data: {
      userId: bob.id,
      name: "Theragun Mini",
      type: "massage",
      tags: ["recovery", "massage"],
      notes: "Great for post-yoga muscle tension",
    },
  });
  await prisma.wellnessAccessory.create({
    data: {
      userId: dave.id,
      name: "Ice Barrel",
      type: "cold_plunge",
      tags: ["cold-plunge", "recovery"],
      notes: "The best cold plunge tub I've tried",
    },
  });

  // Steps entries (past week for alice)
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    await prisma.stepsEntry.create({
      data: {
        userId: alice.id,
        date,
        count: 6000 + Math.floor(Math.random() * 8000),
        source: "manual",
      },
    });
  }

  console.log("Seed complete!");
  console.log("Test accounts (all password: password123):");
  console.log("  alice@example.com / alice");
  console.log("  bob@example.com   / bob");
  console.log("  carol@example.com / carol (private)");
  console.log("  dave@example.com  / dave");
  console.log("  eve@example.com   / eve");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12 - n, 0, 0, 0); // vary the hour so ordering looks natural
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

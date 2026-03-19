import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AFFILIATE_CATEGORIES = [
  "SUPPLEMENTS", "WELLNESS_ACCESSORIES", "GYM_ACCESSORIES",
  "RECOVERY_TOOLS", "APPAREL", "NUTRITION", "TECH_WEARABLES", "OTHER",
] as const;

export const createPostSchema = z.object({
  type: z.enum(["WORKOUT", "MEAL", "WELLNESS", "GENERAL", "CHECKIN", "AFFILIATE"]),
  caption: z.string().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  gymId: z.string().optional(),
  mediaUrl: z.string().optional(),
  postDate: z.string().optional(), // ISO date string for backdating posts

  // Workout fields
  workout: z
    .object({
      workoutName: z.string().min(1).max(200),
      isClass: z.boolean().default(false),
      muscleGroups: z.array(z.string()).default([]),
      durationMinutes: z.number().int().positive().optional(),
      perceivedExertion: z.number().int().min(1).max(10).optional(),
      moodAfter: z.number().int().min(1).max(10).optional(),
      notes: z.string().max(2000).optional(),
      postTiming: z.enum(["BEFORE", "DURING", "AFTER"]).default("AFTER"),
      exercises: z
        .array(
          z.object({
            name: z.string().min(1).max(200),
            sets: z
              .array(
                z.object({
                  reps: z.number().int().positive().optional(),
                  weight: z.number().positive().optional(),
                  unit: z.string().default("lbs"),
                  rpe: z.number().int().min(1).max(10).optional(),
                })
              )
              .default([]),
          })
        )
        .default([]),
    })
    .optional(),

  // Meal fields
  meal: z
    .object({
      mealName: z.string().min(1).max(200),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"),
      ingredients: z.array(z.string().max(200)).default([]),
      calories: z.number().int().positive().optional(),
      protein: z.number().positive().optional(),
      carbs: z.number().positive().optional(),
      fat: z.number().positive().optional(),
      recipeSourceUrl: z.string().url().optional().or(z.literal("")),
      saveToCatalog: z.boolean().default(false),
    })
    .optional(),

  // Wellness fields
  wellness: z
    .object({
      activityType: z.string().min(1).max(100),
      durationMinutes: z.number().int().positive().optional(),
      intensity: z.number().int().min(1).max(10).optional(),
      moodAfter: z.number().int().min(1).max(10).optional(),
      notes: z.string().max(2000).optional(),
    })
    .optional(),

  // Affiliate fields
  affiliate: z
    .object({
      affiliateItemId: z.string().optional(),
      title: z.string().min(1).max(200),
      brand: z.string().max(200).optional(),
      link: z.string().url().optional().or(z.literal("")),
      referralCode: z.string().max(100).optional(),
      category: z.enum(AFFILIATE_CATEGORIES).default("OTHER"),
    })
    .optional(),

  // External content
  externalUrl: z.string().url().optional().or(z.literal("")),
  embed: z
    .object({
      provider: z.enum(["instagram", "tiktok", "youtube"]),
      url: z.string().url(),
      contentId: z.string().min(1).max(200),
      title: z.string().max(300).optional(),
      thumbnailUrl: z.string().url().optional(),
    })
    .optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const createGymSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const catalogMealSchema = z.object({
  name: z.string().min(1).max(200),
  ingredients: z.array(z.string()).default([]),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  recipeSourceUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const catalogWorkoutSchema = z.object({
  name: z.string().min(1).max(200),
  exercisesJson: z.string(),
  videoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const supplementSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  dose: z.string().max(100).optional(),
  schedule: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  photoUrl: z.string().optional(),
  link: z.string().optional(),
  referralCode: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
});

export const wellnessAccessorySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().max(100).optional(),
  link: z.string().optional(),
  photoUrl: z.string().optional(),
  referralCode: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export const catalogWellnessSchema = z.object({
  name: z.string().min(1).max(200),
  activityType: z.string().max(100).optional(),
  durationMinutes: z.number().int().positive().optional(),
  link: z.string().optional(),
  photoUrl: z.string().optional(),
  referralCode: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export const affiliateItemSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  link: z.string().url().optional().or(z.literal("")),
  referralCode: z.string().max(100).optional(),
  category: z.enum(AFFILIATE_CATEGORIES).default("OTHER"),
  photoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  subcategoryTags: z.array(z.string()).default([]),
  ctaLabel: z.string().max(100).optional(),
  logoUrl: z.string().optional(),
  enrichmentConfidence: z.string().max(50).optional(),
  needsReview: z.boolean().default(false),
});

export const stepsEntrySchema = z.object({
  date: z.string(), // ISO date string
  count: z.number().int().positive(),
  source: z.string().default("manual"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;

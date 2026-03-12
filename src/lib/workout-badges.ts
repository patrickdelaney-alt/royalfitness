// ── Workout Badge Library ─────────────────────────────────────────────────────
// When a post has no media, a fun badge card is shown instead.
// Names are randomly but deterministically selected using the post ID as a seed,
// so the same post always shows the same badge.

const WORKOUT_BADGES: Record<string, { names: string[]; emoji: string; gradient: string }> = {
  glutes: {
    emoji: "🍑",
    gradient: "linear-gradient(135deg, #db2777, #7c3aed)",
    names: [
      "Booty Blaster",
      "Peach Punisher",
      "Glute Gladiator",
      "Buns of Steel",
      "Posterior Power",
      "Cheek Chiseler",
      "Rump Raider",
      "Backside Boss",
      "Hip Hustler",
      "Booty Builder",
      "Peach Perfecter",
      "Glute Grinder",
      "Butt Boss",
      "Posterior Pro",
      "Donk Destroyer",
      "Rear Ruler",
      "Booty Architect",
      "Glute Genius",
      "Peach Protocol",
      "Bum Burner",
      "Glute Guru",
      "Bootylicious Warrior",
      "Squat Queen",
      "Hip Hinge Hero",
      "Booty Sculptor",
    ],
  },
  legs: {
    emoji: "🦵",
    gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    names: [
      "Leg Day Legend",
      "Quad Crusher",
      "Ham Hammer",
      "Quadzilla",
      "Leg Press Lord",
      "Squat Sovereign",
      "Thigh Tyrant",
      "Lunge Lord",
      "Calf Commander",
      "Knee Bender",
      "Leg Day Survivor",
      "Quad Quaker",
      "The Walking Soreness",
      "Hamstring Hero",
      "Stair Destroyer",
      "Step King",
      "Leg Machine",
      "Lower Body Legend",
      "Quad God",
      "Pistol Pro",
      "Deadlift Deity",
      "RDL Royalty",
      "Hammy Hunter",
      "Calf Carver",
      "Leg Demolisher",
    ],
  },
  chest: {
    emoji: "💪",
    gradient: "linear-gradient(135deg, #2563eb, #4f46e5)",
    names: [
      "Chest Champion",
      "Pec Pulverizer",
      "Bench Beast",
      "Press Predator",
      "Pec Architect",
      "Flat Bench Fury",
      "Incline Invader",
      "Chest Commander",
      "Pec Perfecter",
      "Barbell Boss",
      "Push Press Pro",
      "Chest Sculptor",
      "Dumbbell Deity",
      "Pec Popper",
      "Fly Guy",
      "Bench Baron",
      "Cable Crossover King",
      "Chest Chisel",
      "Press Pioneer",
      "Rack Ruler",
      "Pec Punisher",
      "Bench Bandit",
      "Chest Crusher",
      "Push Pro",
      "Iron Chest Icon",
    ],
  },
  back: {
    emoji: "🏋️",
    gradient: "linear-gradient(135deg, #0369a1, #1d4ed8)",
    names: [
      "Back Attacker",
      "Lat Legend",
      "Row Warrior",
      "Pull-Up Predator",
      "Deadlift Deity",
      "Lats for Days",
      "Row Master",
      "Back Builder",
      "Spine Shredder",
      "Trap King",
      "Wide Back Warlord",
      "Cable Row Cowboy",
      "Lat Pulldown Lord",
      "V-Taper Visionary",
      "Rack Puller",
      "The Terminator",
      "Back Boss",
      "Rhomboid Ruler",
      "Pull Pro",
      "Iron Back Icon",
      "Row Royalty",
      "Posterior Chain Champion",
      "Deadlift Dominator",
      "Cobra Back Creator",
      "Lats of Steel",
    ],
  },
  shoulders: {
    emoji: "🎯",
    gradient: "linear-gradient(135deg, #d97706, #dc2626)",
    names: [
      "Boulder Shoulders",
      "Delt Destroyer",
      "Press Princess",
      "Shoulder Shredder",
      "OHP Overlord",
      "Delt Dominator",
      "Lateral Raise Legend",
      "Shoulder Sculptor",
      "Cap Creator",
      "Press Predator",
      "Delt Deity",
      "Cannonball Creator",
      "Front Raise Fury",
      "Shoulder Press Sovereign",
      "Trap Titan",
      "Dumbbell Delt Destroyer",
      "Press Pioneer",
      "3D Delt Developer",
      "Shoulder Cannon Craftsman",
      "Overhead Icon",
      "Delt Diamond",
      "Shoulder Maestro",
      "Rotator Cuff Royalty",
      "Rear Delt Ruler",
      "Boulder Builder",
    ],
  },
  arms: {
    emoji: "💪",
    gradient: "linear-gradient(135deg, #ea580c, #dc2626)",
    names: [
      "Gun Show",
      "Bicep Bandit",
      "Curl King",
      "Tricep Terminator",
      "Arm Architect",
      "Peak Seeker",
      "Flexin Champion",
      "Sleeve Buster",
      "Arm Annihilator",
      "Curl Commander",
      "Bicep Builder",
      "Tricep Titan",
      "Arm Sculptor",
      "Peak Perfecter",
      "Hammer Curl Hero",
      "Skullcrusher Supreme",
      "Preacher Curl Pro",
      "Cable Curl Conqueror",
      "EZ Bar Emperor",
      "Arm Day Ace",
      "Vein Chaser",
      "Pump Seeker",
      "Flex Master",
      "Bicep Blaster",
      "Tricep Destroyer",
    ],
  },
  core: {
    emoji: "🔥",
    gradient: "linear-gradient(135deg, #ca8a04, #d97706)",
    names: [
      "Core Commander",
      "Ab Assassin",
      "Plank Pioneer",
      "Crunch Crusader",
      "Six-Pack Seeker",
      "Core Crusher",
      "Ab Architect",
      "Plank Master",
      "Oblique Overlord",
      "Midsection Master",
      "Core Sculptor",
      "Hollow Hold Hero",
      "Dragon Flag Deity",
      "Ab Ripper",
      "Vacuum Champion",
      "Core Carver",
      "Ab Blaster",
      "Plank Predator",
      "Sit-Up Sovereign",
      "Hanging Leg Legend",
      "Twisting Titan",
      "Core Gladiator",
      "Steel Core Creator",
      "Abs of Fury",
      "Ab Day Ace",
    ],
  },
  cardio: {
    emoji: "🏃",
    gradient: "linear-gradient(135deg, #dc2626, #db2777)",
    names: [
      "Cardio Crusher",
      "Sweat Machine",
      "Endurance Emperor",
      "Cardio King",
      "Heart Rate Hero",
      "VO2 Vanquisher",
      "Zone 2 Zealot",
      "Treadmill Titan",
      "HIIT Hammer",
      "Cardio Commander",
      "Lung Buster",
      "Sweat Lord",
      "Aerobic Ace",
      "Steady State Supreme",
      "Interval Icon",
      "Pace Setter",
      "Endurance Elite",
      "Mile Master",
      "Cardio Gladiator",
      "Sprinting Sovereign",
      "Fat Burner",
      "Rower Royalty",
      "Bike Boss",
      "Stairmaster Slayer",
      "Cardio Architect",
    ],
  },
};

const MEAL_BADGES: Record<string, { names: string[]; emoji: string }> = {
  breakfast: {
    emoji: "🌅",
    names: [
      "Morning Macro Master",
      "Sunrise Fueler",
      "AM Gains Maker",
      "Breakfast Champion",
      "First Meal Fury",
      "Dawn Devourer",
      "Morning Muscle Maker",
      "Breakfast Boss",
      "Rise and Refuel",
      "Morning Warrior",
      "Sunrise Slayer",
      "AM Appetite",
      "Early Bird Eater",
      "Breakfast Legend",
      "Macro Sunrise",
      "Dawn Destroyer",
      "Morning Fuel Master",
      "First Plate Pro",
      "AM Athlete",
      "Breakfast Architect",
      "Sunrise Sculptor",
      "Morning Gains God",
      "Fuel First Legend",
      "Breakfast Bandit",
      "AM Advantage",
    ],
  },
  lunch: {
    emoji: "☀️",
    names: [
      "Midday Muscle Maker",
      "Noon Nourisher",
      "Lunch Legend",
      "Afternoon Fueler",
      "Midday Macro Master",
      "Lunch Boss",
      "Noon Ninja",
      "Midday Champion",
      "Lunchtime Legend",
      "Noon Destroyer",
      "Afternoon Athlete",
      "Midday Meal Master",
      "Lunch Lord",
      "Noon Nourishment Pro",
      "Midday Maverick",
      "Lunch Architect",
      "Afternoon Advantage",
      "Noon Gains Maker",
      "Midday Monster",
      "Lunch Gladiator",
      "Power Lunch Pro",
      "Noon Refuel King",
      "Midday Muscle",
      "Lunch Lionheart",
      "Noon Titan",
    ],
  },
  dinner: {
    emoji: "🌙",
    names: [
      "Evening Elite Eater",
      "Dinner Dominator",
      "Nighttime Nourisher",
      "PM Protein Pro",
      "Dinner Champion",
      "Evening Fueler",
      "Night Meal Master",
      "Dinner Legend",
      "PM Macro Master",
      "Evening Architect",
      "Dinner Boss",
      "Nighttime Gains Maker",
      "PM Powerhouse",
      "Evening Destroyer",
      "Dinner Deity",
      "Night Refuel King",
      "Dusk Devourer",
      "Evening Gladiator",
      "PM Athlete",
      "Dinner Titan",
      "Nighttime Ninja",
      "Evening Muscle Maker",
      "Last Plate Legend",
      "Dinner Maverick",
      "PM Feast Master",
    ],
  },
  snack: {
    emoji: "⚡",
    names: [
      "Snack Strategist",
      "Gains Grazer",
      "Macro Muncher",
      "Quick Fuel King",
      "Snack Champion",
      "Between Meal Boss",
      "Micro Meal Master",
      "Snack Architect",
      "Quick Gains Maker",
      "Snack Legend",
      "Fuel Snippet Pro",
      "Nibble Ninja",
      "Snack Sovereign",
      "Quick Refuel Royalty",
      "Protein Pitstop",
      "Snack Destroyer",
      "Grazing Gladiator",
      "Mini Meal Master",
      "Snack Titan",
      "Fueling Fury",
      "Calorie Commander",
      "Nibble Lord",
      "Snack Dominator",
      "Quick Bite Boss",
      "Gains Nibbler",
    ],
  },
};

const WELLNESS_BADGES: { names: string[]; emoji: string; gradient: string } = {
  emoji: "🧘",
  gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  names: [
    "Zen Warrior",
    "Recovery Royalty",
    "Mind Body Master",
    "Wellness Champion",
    "Rest Day Ruler",
    "Zen Destroyer",
    "Mindful Master",
    "Recovery Pro",
    "Wellness Wizard",
    "Peaceful Predator",
    "Chill Champion",
    "Restoration King",
    "Wellness Architect",
    "Flow State Fighter",
    "Inner Peace Pro",
    "Balance Boss",
    "Zen Zone Legend",
    "Recovery Ace",
    "Mindfulness Master",
    "Wellness Gladiator",
    "Calm Commander",
    "Rest Day Royalty",
    "Stretch Sovereign",
    "Recovery Titan",
    "Zen Elite",
  ],
};

// ── Badge selection helpers ───────────────────────────────────────────────────

function seedIndex(postId: string, max: number): number {
  let hash = 0;
  for (const c of postId) {
    hash = (hash * 31 + c.charCodeAt(0)) & 0x7fffffff;
  }
  return hash % max;
}

export interface BadgeData {
  name: string;
  emoji: string;
  gradient: string;
  subtitle: string;
}

interface PostForBadge {
  id: string;
  type: string;
  mediaUrl?: string | null;
  workoutDetail?: {
    workoutName: string;
    muscleGroups: string[];
  } | null;
  mealDetail?: {
    mealName: string;
    mealType: string;
  } | null;
  wellnessDetail?: {
    activityType: string;
  } | null;
}

export function getPostBadge(post: PostForBadge): BadgeData | null {
  if (post.mediaUrl) return null;

  if (post.type === "WORKOUT" && post.workoutDetail) {
    const { muscleGroups, workoutName } = post.workoutDetail;

    // Pick the primary muscle group — first selected, or default to "cardio"
    const primary =
      muscleGroups.find((g) => WORKOUT_BADGES[g]) ?? "cardio";
    const group = WORKOUT_BADGES[primary] ?? WORKOUT_BADGES.cardio;
    const idx = seedIndex(post.id, group.names.length);

    return {
      name: group.names[idx],
      emoji: group.emoji,
      gradient: group.gradient,
      subtitle: workoutName,
    };
  }

  if (post.type === "MEAL" && post.mealDetail) {
    const { mealName, mealType } = post.mealDetail;
    const group =
      MEAL_BADGES[mealType] ?? MEAL_BADGES.snack;
    const idx = seedIndex(post.id, group.names.length);

    return {
      name: group.names[idx],
      emoji: group.emoji,
      gradient: "linear-gradient(135deg, #16a34a, #059669)",
      subtitle: mealName,
    };
  }

  if (post.type === "WELLNESS" && post.wellnessDetail) {
    const idx = seedIndex(post.id, WELLNESS_BADGES.names.length);
    return {
      name: WELLNESS_BADGES.names[idx],
      emoji: WELLNESS_BADGES.emoji,
      gradient: WELLNESS_BADGES.gradient,
      subtitle: post.wellnessDetail.activityType,
    };
  }

  return null;
}

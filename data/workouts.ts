"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

/**
 * Get all workouts for the authenticated user on a specific date
 */
export async function getUserWorkoutsByDate(date: Date) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Set date range for the entire day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch workouts with related exercises and sets using Drizzle's query API
  const userWorkouts = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, startOfDay),
      lt(workouts.startedAt, endOfDay)
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: [desc(workouts.startedAt)],
  });

  return userWorkouts;
}

/**
 * Get all workouts for the authenticated user
 */
export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: [desc(workouts.startedAt)],
  });
}

/**
 * Get a single workout by ID for the authenticated user
 */
export async function getUserWorkoutById(workoutId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });

  return workout;
}

/**
 * Update a workout's basic information
 */
export async function updateWorkout(workoutId: number, data: {
  name?: string;
  startedAt?: Date;
  completedAt?: Date | null;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership before updating
  const existingWorkout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ),
  });

  if (!existingWorkout) {
    throw new Error("Workout not found or unauthorized");
  }

  const [updatedWorkout] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workouts.id, workoutId))
    .returning();

  return updatedWorkout;
}

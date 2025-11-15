import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Type for creating a workout
export type CreateWorkoutData = {
  userId: string;
  name?: string;
  startedAt: Date;
};

// Type for updating a workout
export type UpdateWorkoutData = {
  name?: string;
  completedAt?: Date;
};

/**
 * Create a new workout
 */
export async function createWorkout(data: CreateWorkoutData) {
  const [workout] = await db
    .insert(workouts)
    .values(data)
    .returning();

  return workout;
}

/**
 * Update an existing workout
 */
export async function updateWorkout(
  id: number,
  userId: string,
  data: UpdateWorkoutData
) {
  const [workout] = await db
    .update(workouts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  return workout;
}

/**
 * Delete a workout
 */
export async function deleteWorkout(id: number, userId: string) {
  const [workout] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  return workout;
}

/**
 * Get user's workouts
 */
export async function getUserWorkouts(userId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt));
}

/**
 * Get a single workout by ID
 */
export async function getWorkout(id: number, userId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .limit(1);

  return workout;
}

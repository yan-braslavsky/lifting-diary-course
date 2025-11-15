'use server';

import { updateWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

export async function updateWorkoutAction(data: {
  workoutId: number;
  name?: string;
  startedAt?: string;
  completedAt?: string | null;
}) {
  try {
    const updateData: {
      name?: string;
      startedAt?: Date;
      completedAt?: Date | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.startedAt) {
      updateData.startedAt = new Date(data.startedAt);
    }

    if (data.completedAt === null) {
      updateData.completedAt = null;
    } else if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt);
    }

    const workout = await updateWorkout(data.workoutId, updateData);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/workout/${data.workoutId}`);

    return { success: true, workout };
  } catch (error) {
    console.error('Failed to update workout:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update workout',
    };
  }
}

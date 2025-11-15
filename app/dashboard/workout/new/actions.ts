'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createWorkout } from '@/src/data/workouts';

// Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(255, 'Name is too long').optional(),
  startedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

/**
 * Create a new workout
 */
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // 1. Validate input
  const validatedData = createWorkoutSchema.parse(input);

  // 2. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 3. Call data helper
    const workout = await createWorkout({
      userId,
      name: validatedData.name,
      startedAt: new Date(validatedData.startedAt),
    });

    // 4. Revalidate relevant paths
    revalidatePath('/dashboard');

    // 5. Return result - NO redirect here, client handles it
    return { success: true, workout };
  } catch (error) {
    console.error('Failed to create workout:', error);
    return { success: false, error: 'Failed to create workout' };
  }
}

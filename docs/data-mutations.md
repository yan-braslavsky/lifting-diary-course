# Data Mutations Documentation

## Overview

This document defines the coding standards for all data mutations in the application. Following these patterns ensures type safety, validation, and maintainability across the codebase.

## Core Principles

1. **Server Actions Only**: All data mutations MUST use Server Actions (never API routes)
2. **Helper Functions**: Database operations MUST go through helper functions in `src/data`
3. **Colocation**: Server Actions MUST be in `actions.ts` files colocated with the features that use them
4. **Type Safety**: All Server Action parameters MUST be explicitly typed (NO `FormData` type)
5. **Validation**: ALL Server Actions MUST validate arguments using Zod schemas
6. **Authentication**: ALL mutations MUST verify user authentication
7. **No Server-Side Redirects**: Server Actions MUST NOT use `redirect()` - handle redirects client-side after the action resolves

## Architecture Layers

```
Client Component
    ↓ (calls)
Server Action (actions.ts)
    ↓ (validates with Zod)
    ↓ (checks auth)
    ↓ (calls)
Data Helper (src/data/*.ts)
    ↓ (executes)
Drizzle ORM → Database
```

## Directory Structure

```
src/
├── data/              # Database helper functions
│   ├── workouts.ts    # Workout-related queries/mutations
│   ├── exercises.ts   # Exercise-related queries/mutations
│   └── ...
│
app/
├── dashboard/
│   └── actions.ts     # Server Actions for dashboard
├── workouts/
│   └── actions.ts     # Server Actions for workouts
└── ...
```

## Data Helper Functions (src/data)

### Purpose

Helper functions in `src/data` provide a clean abstraction over Drizzle ORM, making database operations reusable and testable.

### Structure

**File**: `src/data/workouts.ts`

```typescript
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Type for creating a workout
export type CreateWorkoutData = {
  userId: string;
  name: string;
  description?: string;
};

// Type for updating a workout
export type UpdateWorkoutData = {
  name?: string;
  description?: string;
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
export async function updateWorkout(id: number, userId: string, data: UpdateWorkoutData) {
  const [workout] = await db
    .update(workouts)
    .set(data)
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
    .orderBy(desc(workouts.createdAt));
}
```

### Helper Function Guidelines

1. **Export Types**: Always export TypeScript types for input data
2. **User Isolation**: Include `userId` in WHERE clauses to prevent unauthorized access
3. **Return Data**: Use `.returning()` to return the affected rows
4. **Documentation**: Add JSDoc comments for complex operations
5. **Error Handling**: Let errors bubble up to be caught by Server Actions

## Server Actions (actions.ts)

### Basic Structure

**File**: `app/workouts/actions.ts`

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts';

// Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

const updateWorkoutSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.number().positive(),
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
    throw new Error('Unauthorized');
  }

  // 3. Call data helper
  const workout = await createWorkout({
    userId,
    ...validatedData,
  });

  // 4. Revalidate relevant paths
  revalidatePath('/workouts');

  // 5. Return result
  return { success: true, workout };
}

/**
 * Update an existing workout
 */
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  const validatedData = updateWorkoutSchema.parse(input);

  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id, ...updateData } = validatedData;
  const workout = await updateWorkout(id, userId, updateData);

  if (!workout) {
    throw new Error('Workout not found or unauthorized');
  }

  revalidatePath('/workouts');
  revalidatePath(`/workouts/${id}`);

  return { success: true, workout };
}

/**
 * Delete a workout
 */
export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  const validatedData = deleteWorkoutSchema.parse(input);

  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const workout = await deleteWorkout(validatedData.id, userId);

  if (!workout) {
    throw new Error('Workout not found or unauthorized');
  }

  revalidatePath('/workouts');

  return { success: true };
}
```

### Server Action Guidelines

1. **Always use `'use server'`** directive at the top of the file
2. **Validate First**: Use Zod schemas to validate ALL inputs
3. **Check Auth**: Verify `userId` exists before any operations
4. **Type Safety**: Use `z.infer<typeof schema>` for parameter types
5. **Revalidate**: Call `revalidatePath()` to update cached data
6. **Consistent Returns**: Return objects with `{ success: boolean, ... }`
7. **Error Handling**: Throw descriptive errors that can be caught by error boundaries
8. **No Redirects**: Never use `redirect()` in Server Actions - return success/error and handle navigation client-side

### Validation Patterns

#### Simple Schema

```typescript
const schema = z.object({
  name: z.string().min(1),
  age: z.number().positive(),
});
```

#### Complex Validation

```typescript
const exerciseSchema = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().positive().max(10),
  reps: z.number().int().positive().max(100),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  restTime: z.number().int().positive().max(600).optional(),
});
```

#### Array Validation

```typescript
const bulkCreateSchema = z.object({
  exercises: z.array(exerciseSchema).min(1).max(20),
});
```

#### Custom Validation

```typescript
const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});
```

## Client Usage

### Basic Form Submission

```typescript
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createWorkoutAction({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
        });

        if (result.success) {
          // Handle redirect client-side after successful mutation
          router.push('/workouts');
        }
      } catch (error) {
        // Handle error (e.g., show error message)
        console.error(error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <textarea name="description" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Workout'}
      </button>
    </form>
  );
}
```

### With React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createWorkoutAction } from './actions';

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateWorkoutForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createWorkoutAction(data);
      form.reset();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### Optimistic Updates

```typescript
'use client';

import { useOptimistic } from 'react';
import { deleteWorkoutAction } from './actions';

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [optimisticWorkouts, setOptimisticWorkouts] = useOptimistic(
    workouts,
    (state, deletedId: number) => state.filter((w) => w.id !== deletedId)
  );

  const handleDelete = async (id: number) => {
    setOptimisticWorkouts(id);
    try {
      await deleteWorkoutAction({ id });
    } catch (error) {
      // Error boundary will catch and revert
    }
  };

  return (
    <ul>
      {optimisticWorkouts.map((workout) => (
        <li key={workout.id}>
          {workout.name}
          <button onClick={() => handleDelete(workout.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

## Common Patterns

### Pattern: Create with Relations

**Data Helper**: `src/data/workouts.ts`

```typescript
export async function createWorkoutWithExercises(
  userId: string,
  workoutData: CreateWorkoutData,
  exercisesData: CreateExerciseData[]
) {
  return db.transaction(async (tx) => {
    const [workout] = await tx
      .insert(workouts)
      .values({ userId, ...workoutData })
      .returning();

    const exercises = await tx
      .insert(exercises)
      .values(
        exercisesData.map((ex) => ({
          ...ex,
          workoutId: workout.id,
        }))
      )
      .returning();

    return { workout, exercises };
  });
}
```

**Server Action**: `app/workouts/actions.ts`

```typescript
const createWithExercisesSchema = z.object({
  name: z.string().min(1),
  exercises: z.array(z.object({
    name: z.string().min(1),
    sets: z.number().positive(),
  })).min(1),
});

export async function createWorkoutWithExercisesAction(
  input: z.infer<typeof createWithExercisesSchema>
) {
  const validatedData = createWithExercisesSchema.parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { exercises, ...workoutData } = validatedData;
  const result = await createWorkoutWithExercises(userId, workoutData, exercises);

  revalidatePath('/workouts');

  return { success: true, ...result };
}
```

### Pattern: Conditional Updates

```typescript
export async function toggleWorkoutFavoriteAction(input: { id: number }) {
  const validatedData = z.object({ id: z.number() }).parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const workout = await getWorkout(validatedData.id, userId);

  if (!workout) {
    throw new Error('Workout not found');
  }

  const updated = await updateWorkout(validatedData.id, userId, {
    isFavorite: !workout.isFavorite,
  });

  revalidatePath('/workouts');

  return { success: true, workout: updated };
}
```

### Pattern: Batch Operations

```typescript
const batchDeleteSchema = z.object({
  ids: z.array(z.number().positive()).min(1).max(50),
});

export async function batchDeleteWorkoutsAction(
  input: z.infer<typeof batchDeleteSchema>
) {
  const validatedData = batchDeleteSchema.parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  await batchDeleteWorkouts(validatedData.ids, userId);

  revalidatePath('/workouts');

  return { success: true };
}
```

## Error Handling

### Server Action Error Handling

```typescript
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  try {
    const validatedData = createWorkoutSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const workout = await createWorkout({ userId, ...validatedData });

    revalidatePath('/workouts');

    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', issues: error.issues };
    }

    console.error('Failed to create workout:', error);
    return { success: false, error: 'Failed to create workout' };
  }
}
```

### Client Error Handling

```typescript
const result = await createWorkoutAction(data);

if (!result.success) {
  toast.error(result.error);
  if (result.issues) {
    // Handle Zod validation errors
    result.issues.forEach((issue) => {
      form.setError(issue.path[0] as any, { message: issue.message });
    });
  }
  return;
}

toast.success('Workout created!');
```

## Common Mistakes to Avoid

❌ **Don't** use `FormData` as the parameter type

```typescript
// WRONG
export async function createWorkout(formData: FormData) {
  const name = formData.get('name');
}
```

✅ **Do** use explicit types with Zod validation

```typescript
// CORRECT
export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
}
```

❌ **Don't** call Drizzle directly from Server Actions

```typescript
// WRONG
export async function createWorkout(input: { name: string }) {
  await db.insert(workouts).values(input);
}
```

✅ **Do** use data helper functions

```typescript
// CORRECT
export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
}
```

❌ **Don't** skip validation

```typescript
// WRONG
export async function createWorkout(input: { name: string }) {
  const { userId } = await auth();
  await createWorkout({ userId, ...input });
}
```

✅ **Do** always validate with Zod

```typescript
// CORRECT
export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
}
```

❌ **Don't** put Server Actions in random files

```typescript
// WRONG - in a component file
'use server';
export async function createWorkout() { ... }
```

✅ **Do** colocate in `actions.ts` files

```typescript
// CORRECT - app/workouts/actions.ts
'use server';
export async function createWorkout() { ... }
```

❌ **Don't** forget to revalidate paths

```typescript
// WRONG
export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
  return { success: true };
}
```

✅ **Do** revalidate affected paths

```typescript
// CORRECT
export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
  revalidatePath('/workouts');
  return { success: true };
}
```

❌ **Don't** use `redirect()` in Server Actions

```typescript
// WRONG
'use server';
import { redirect } from 'next/navigation';

export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
  revalidatePath('/workouts');
  redirect('/workouts'); // ❌ Don't redirect from Server Action
}
```

✅ **Do** handle redirects client-side

```typescript
// CORRECT - Server Action
'use server';

export async function createWorkout(input: { name: string }) {
  const validatedData = schema.parse(input);
  const { userId } = await auth();
  await createWorkout({ userId, ...validatedData });
  revalidatePath('/workouts');
  return { success: true }; // ✅ Return success, let client handle redirect
}

// CORRECT - Client Component
'use client';
import { useRouter } from 'next/navigation';

export function CreateForm() {
  const router = useRouter();

  const handleSubmit = async (data) => {
    const result = await createWorkout(data);
    if (result.success) {
      router.push('/workouts'); // ✅ Redirect client-side
    }
  };
}
```

## Testing

### Testing Data Helpers

```typescript
import { describe, it, expect } from 'vitest';
import { createWorkout, getUserWorkouts } from '@/data/workouts';

describe('Workout data helpers', () => {
  it('should create a workout', async () => {
    const workout = await createWorkout({
      userId: 'test-user',
      name: 'Test Workout',
    });

    expect(workout).toBeDefined();
    expect(workout.name).toBe('Test Workout');
  });

  it('should filter workouts by user', async () => {
    const workouts = await getUserWorkouts('test-user');
    expect(workouts.every((w) => w.userId === 'test-user')).toBe(true);
  });
});
```

### Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createWorkoutAction } from './actions';

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user' })),
}));

describe('Workout actions', () => {
  it('should validate input', async () => {
    await expect(
      createWorkoutAction({ name: '' })
    ).rejects.toThrow();
  });

  it('should create workout with valid input', async () => {
    const result = await createWorkoutAction({
      name: 'Test Workout',
    });

    expect(result.success).toBe(true);
    expect(result.workout).toBeDefined();
  });
});
```

## Best Practices Summary

1. ✅ Use Server Actions in `actions.ts` files
2. ✅ Wrap all DB calls in `src/data` helpers
3. ✅ Validate ALL inputs with Zod
4. ✅ Use explicit types (NO `FormData`)
5. ✅ Check authentication in every Server Action
6. ✅ Revalidate paths after mutations
7. ✅ Return consistent result objects
8. ✅ Handle errors gracefully
9. ✅ Use transactions for multi-table operations
10. ✅ Document complex operations with JSDoc

## Additional Resources

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Documentation](https://zod.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

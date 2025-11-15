# Data Fetching Guidelines

## Core Principle

**ALL data fetching in this application MUST be done via Server Components.**

This is a non-negotiable architecture decision. Do NOT deviate from this pattern.

## What This Means

### ✅ ALLOWED
- Fetching data in Server Components (async components in the `app` directory)
- Using helper functions from `/data` directory within Server Components
- Passing fetched data to Client Components as props

### ❌ PROHIBITED
- Fetching data in Route Handlers (`app/api/*`)
- Fetching data in Client Components (`"use client"`)
- Fetching data in middleware
- Any other data fetching pattern not explicitly listed as allowed

## Why Server Components Only?

1. **Security**: Server Components never expose database queries or credentials to the client
2. **Performance**: Data is fetched on the server, reducing client-side JavaScript and round trips
3. **Simplicity**: Single, predictable data fetching pattern across the entire application
4. **Type Safety**: Full TypeScript support with Drizzle ORM schemas
5. **Colocation**: Data fetching logic lives near the components that need it

## Database Query Pattern

### Required Structure

All database queries MUST follow this pattern:

1. Create a helper function in the `/data` directory
2. Use Drizzle ORM for all database operations
3. Include user authentication and authorization checks
4. Call the helper from a Server Component

### Example

**File: `/data/workouts.ts`**
```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // ALWAYS filter by userId to ensure data isolation
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

**File: `app/dashboard/page.tsx`** (Server Component)
```typescript
import { getUserWorkouts } from "@/data/workouts";
import { WorkoutList } from "@/components/workout-list";

export default async function DashboardPage() {
  const workouts = await getUserWorkouts();

  return (
    <div>
      <h1>My Workouts</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

**File: `components/workout-list.tsx`** (Client Component)
```typescript
"use client";

import { type Workout } from "@/db/schema";

interface WorkoutListProps {
  workouts: Workout[];
}

export function WorkoutList({ workouts }: WorkoutListProps) {
  // Client component receives data as props
  // NO data fetching here
  return (
    <ul>
      {workouts.map((workout) => (
        <li key={workout.id}>{workout.name}</li>
      ))}
    </ul>
  );
}
```

## Critical Security Rule

### User Data Isolation

**EVERY database query MUST include user authentication and authorization checks.**

```typescript
// ❌ WRONG - No user filtering
export async function getWorkouts() {
  return await db.select().from(workouts);
}

// ✅ CORRECT - Always filter by userId
export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

### Key Security Requirements

1. **Always call `auth()`** at the start of every data helper function
2. **Always check `userId`** exists before proceeding
3. **Always filter queries by `userId`** to ensure users only see their own data
4. **Never trust client input** for user identification - always use `auth().userId`

## Drizzle ORM - NO Raw SQL

### ✅ CORRECT - Use Drizzle ORM
```typescript
import { db } from "@/db";
import { workouts, exercises } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getUserWorkoutsWithExercises() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.createdAt));
}
```

### ❌ WRONG - Raw SQL
```typescript
// NEVER DO THIS
export async function getUserWorkouts() {
  const { userId } = await auth();
  const result = await db.execute(
    `SELECT * FROM workouts WHERE user_id = '${userId}'`
  );
  return result;
}
```

## Organization

### `/data` Directory Structure

```
/data
  ├── workouts.ts          # Workout-related queries
  ├── exercises.ts         # Exercise-related queries
  ├── user-settings.ts     # User settings queries
  └── index.ts             # Optional: re-export all helpers
```

### Naming Convention

- Use descriptive function names: `getUserWorkouts()`, `createWorkout()`, `updateExercise()`
- Prefix with `get` for reads, `create` for inserts, `update` for updates, `delete` for deletions
- Always include `User` in the name to emphasize user-scoped operations

## Data Mutations

For creating, updating, or deleting data, follow the same pattern with Server Actions:

```typescript
// /data/workouts.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createWorkout(name: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name,
      createdAt: new Date(),
    })
    .returning();

  revalidatePath("/dashboard");
  return workout;
}

export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Double-check ownership before deleting
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    );

  revalidatePath("/dashboard");
}
```

## Common Patterns

### Loading States

Use React Suspense for loading states:

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";
import { getUserWorkouts } from "@/data/workouts";
import { WorkoutList } from "@/components/workout-list";

async function WorkoutsContent() {
  const workouts = await getUserWorkouts();
  return <WorkoutList workouts={workouts} />;
}

export default function DashboardPage() {
  return (
    <div>
      <h1>My Workouts</h1>
      <Suspense fallback={<div>Loading workouts...</div>}>
        <WorkoutsContent />
      </Suspense>
    </div>
  );
}
```

### Error Handling

Use error boundaries and try/catch in Server Components:

```typescript
import { getUserWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  try {
    const workouts = await getUserWorkouts();
    return <WorkoutList workouts={workouts} />;
  } catch (error) {
    console.error("Failed to load workouts:", error);
    return <div>Failed to load workouts. Please try again.</div>;
  }
}
```

## Checklist for Every Data Operation

Before implementing any data fetching or mutation, verify:

- [ ] Is this in a Server Component or Server Action?
- [ ] Is there a helper function in `/data`?
- [ ] Does the helper use Drizzle ORM (not raw SQL)?
- [ ] Does the helper call `auth()` from Clerk?
- [ ] Does the helper check `userId` exists?
- [ ] Does the query filter by `userId`?
- [ ] For mutations, is ownership verified before modifying data?

If any answer is "no", **do not proceed** until the issue is resolved.

## Summary

1. **Server Components only** - No exceptions
2. **Helper functions in `/data`** - Keep logic organized
3. **Drizzle ORM always** - Type-safe, no raw SQL
4. **User isolation is critical** - Always filter by `userId`
5. **Auth checks required** - Every single data operation

Following these patterns ensures a secure, maintainable, and performant application.

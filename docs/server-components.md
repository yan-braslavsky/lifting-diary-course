# Server Components

This document outlines coding standards and best practices for Server Components in this Next.js 15 application.

## Critical: Next.js 15 Params Handling

**IMPORTANT: In Next.js 15, `params` is now a Promise and MUST be awaited.**

### ❌ Incorrect (Next.js 14 pattern - DO NOT USE)

```tsx
// This will NOT work in Next.js 15
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id; // ERROR: params is a Promise
  // ...
}
```

### ✅ Correct (Next.js 15 pattern - ALWAYS USE)

```tsx
// Option 1: Async component with await
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}

// Option 2: use() hook (React 19)
import { use } from 'react';

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // ...
}
```

## Server Component Fundamentals

### When to Use Server Components

Server Components are the **default** in Next.js 15 App Router. Use them for:

- Data fetching from databases or APIs
- Accessing backend resources directly
- Keeping sensitive information on the server (API keys, tokens)
- Reducing client-side JavaScript bundle size
- SEO-critical content

### File Conventions

Server Components:
- Default for all components in `app/` directory
- No `"use client"` directive needed
- Can be `async` functions

Client Components:
- Must have `"use client"` directive at top of file
- Cannot be `async`
- Needed for interactivity, hooks, browser APIs

## Data Fetching Patterns

### Basic Async Component

```tsx
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, id),
  });

  if (!workout) {
    notFound();
  }

  return <div>{workout.name}</div>;
}
```

### Multiple Async Operations

```tsx
export default async function Dashboard({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Parallel data fetching
  const [user, workouts, stats] = await Promise.all([
    getUser(userId),
    getWorkouts(userId),
    getStats(userId),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <WorkoutList workouts={workouts} />
      <StatsPanel stats={stats} />
    </div>
  );
}
```

### Using searchParams

Like `params`, `searchParams` is also a Promise in Next.js 15:

```tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const { query, page } = await searchParams;

  const results = await search(query, parseInt(page || '1'));

  return <Results data={results} />;
}
```

## Authentication in Server Components

### Using Clerk Auth

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user-specific data
  const data = await getUserData(userId);

  return <div>{/* render content */}</div>;
}
```

### Accessing Current User

```tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

## Error Handling

### Not Found Handling

```tsx
import { notFound } from 'next/navigation';

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, id),
  });

  if (!workout) {
    notFound(); // Shows 404 page
  }

  return <WorkoutDetails workout={workout} />;
}
```

### Error Boundaries

Create `error.tsx` in the same directory:

```tsx
'use client'; // Error boundaries must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Loading States

Create `loading.tsx` in the same directory:

```tsx
export default function Loading() {
  return <div>Loading workout...</div>;
}
```

## Combining Server and Client Components

### Pattern: Server Component Wrapping Client Component

```tsx
// app/workouts/[id]/page.tsx (Server Component)
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);

  // Pass server-fetched data to client component
  return <WorkoutEditor workout={workout} />;
}

// components/workout-editor.tsx (Client Component)
'use client';

import { useState } from 'react';

export function WorkoutEditor({ workout }: { workout: Workout }) {
  const [name, setName] = useState(workout.name);
  // Interactive editing logic...

  return <form>{/* ... */}</form>;
}
```

## Database Queries

### Direct Database Access (Server Only)

```tsx
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export default async function WorkoutList({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const userWorkouts = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      eq(workouts.archived, false)
    ),
    orderBy: [desc(workouts.createdAt)],
    limit: 50,
  });

  return (
    <ul>
      {userWorkouts.map((workout) => (
        <li key={workout.id}>{workout.name}</li>
      ))}
    </ul>
  );
}
```

## Metadata Generation

### Static Metadata

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workouts',
  description: 'View and manage your workouts',
};

export default function WorkoutsPage() {
  return <div>Workouts</div>;
}
```

### Dynamic Metadata

```tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const workout = await getWorkout(id);

  return {
    title: workout.name,
    description: `Workout details for ${workout.name}`,
  };
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

## Best Practices

### ✅ DO

- Always await `params` and `searchParams` in Next.js 15
- Keep Server Components async when fetching data
- Fetch data as close to where it's needed as possible
- Use parallel data fetching with `Promise.all()` when possible
- Type your params and searchParams properly
- Use `notFound()` for missing resources
- Keep sensitive logic and API keys in Server Components

### ❌ DON'T

- Don't access `params` directly without awaiting (Next.js 15+)
- Don't use React hooks in Server Components
- Don't use browser APIs (`window`, `document`, etc.)
- Don't add event handlers (`onClick`, `onChange`, etc.)
- Don't use `useState`, `useEffect`, or other client-side hooks
- Don't import Server Components into Client Components

## Migration from Next.js 14

If upgrading from Next.js 14, update all dynamic route handlers:

### Before (Next.js 14)
```tsx
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}
```

### After (Next.js 15)
```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

## Common Patterns

### Layout with Dynamic Segment

```tsx
// app/workouts/[id]/layout.tsx
export default async function WorkoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);

  return (
    <div>
      <h1>{workout.name}</h1>
      {children}
    </div>
  );
}
```

### Nested Dynamic Routes

```tsx
// app/workouts/[workoutId]/exercises/[exerciseId]/page.tsx
export default async function ExercisePage({
  params,
}: {
  params: Promise<{ workoutId: string; exerciseId: string }>;
}) {
  const { workoutId, exerciseId } = await params;

  const [workout, exercise] = await Promise.all([
    getWorkout(workoutId),
    getExercise(exerciseId),
  ]);

  return (
    <div>
      <h1>{workout.name}</h1>
      <h2>{exercise.name}</h2>
    </div>
  );
}
```

## Resources

- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 15 Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [React Server Components](https://react.dev/reference/rsc/server-components)

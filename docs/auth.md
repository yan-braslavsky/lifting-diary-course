# Authentication Documentation

## Overview

This application uses [Clerk](https://clerk.com/) for authentication and user management. Clerk provides a complete authentication solution with built-in UI components, session management, and security best practices.

## Core Principles

1. **Server-First Authentication**: Always verify authentication on the server side for protected routes and API endpoints
2. **Use Clerk's Components**: Leverage Clerk's pre-built components instead of building custom auth UI
3. **Consistent Patterns**: Follow the same authentication patterns across the codebase
4. **Type Safety**: Use TypeScript types provided by Clerk for type-safe auth operations

## Setup and Configuration

### Environment Variables

Required environment variables (stored in `.env.local`, never committed):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Middleware Configuration

**File**: `middleware.ts`

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Important**: Always use `clerkMiddleware()` (NOT the deprecated `authMiddleware()`)

### Root Layout

**File**: `app/layout.tsx`

The root layout must wrap the entire application with `<ClerkProvider>`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Import Guidelines

### Server Components and Server Actions

```typescript
// For Server Components and API routes
import { auth, currentUser } from '@clerk/nextjs/server';
```

### Client Components

```typescript
// For Client Components
import {
  useUser,
  useAuth,
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut
} from '@clerk/nextjs';
```

## Common Patterns

### 1. Server Component Authentication

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // User is authenticated
  return <div>Protected content</div>;
}
```

### 2. Getting User Data in Server Components

```typescript
import { currentUser } from '@clerk/nextjs/server';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h1>Welcome {user.firstName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### 3. Client Component Authentication

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export default function ClientComponent() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Hello {user.firstName}</div>;
}
```

### 4. Conditional Rendering Based on Auth State

```typescript
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

### 5. API Route Protection

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process authenticated request
  return NextResponse.json({ data: 'protected data' });
}
```

### 6. Server Actions

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createWorkout(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Process the action
}
```

## UI Components

### Pre-built Components

Clerk provides these ready-to-use components:

- `<SignIn />` - Full sign-in page
- `<SignUp />` - Full sign-up page
- `<UserProfile />` - User profile management
- `<UserButton />` - User menu dropdown
- `<SignInButton />` - Sign-in trigger button
- `<SignUpButton />` - Sign-up trigger button
- `<SignOutButton />` - Sign-out button

### Component Usage Example

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}
```

## Database Integration

### Storing User IDs

Always use Clerk's `userId` as the foreign key in your database:

```typescript
// Drizzle schema example
export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Querying User-Specific Data

```typescript
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

## Security Best Practices

1. **Never Trust Client-Side Auth**: Always verify authentication on the server
2. **Use Server Actions**: Prefer Server Actions over API routes for mutations
3. **Validate User IDs**: Always check that the authenticated user owns the resource they're accessing
4. **Type Safety**: Use TypeScript to catch auth-related bugs at compile time
5. **Error Handling**: Handle auth errors gracefully and provide clear user feedback

## Common Mistakes to Avoid

❌ **Don't** use the deprecated `authMiddleware()`
```typescript
// WRONG
import { authMiddleware } from '@clerk/nextjs';
export default authMiddleware();
```

✅ **Do** use `clerkMiddleware()`
```typescript
// CORRECT
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
```

❌ **Don't** mix server and client imports
```typescript
// WRONG - in a Client Component
import { auth } from '@clerk/nextjs/server';
```

✅ **Do** use the correct imports for your component type
```typescript
// CORRECT - in a Client Component
import { useAuth } from '@clerk/nextjs';
```

❌ **Don't** skip auth checks in Server Actions
```typescript
// WRONG
'use server';
export async function deleteWorkout(id: number) {
  await db.delete(workouts).where(eq(workouts.id, id));
}
```

✅ **Do** always verify authentication
```typescript
// CORRECT
'use server';
export async function deleteWorkout(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db.delete(workouts)
    .where(eq(workouts.id, id))
    .where(eq(workouts.userId, userId));
}
```

## Testing Authentication

When testing auth flows:

1. Use Clerk's test mode (keys starting with `pk_test_` and `sk_test_`)
2. Create test users through Clerk Dashboard
3. Test both authenticated and unauthenticated states
4. Verify proper redirects and error handling

## Additional Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
- [Clerk API Reference](https://clerk.com/docs/reference/backend-api)

## Getting API Keys

Get your Clerk API keys from: [https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)

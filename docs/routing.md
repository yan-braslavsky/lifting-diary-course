# Routing Standards

## Overview

This document defines the routing architecture and protection standards for the application. All user-facing routes are organized under `/dashboard` with authentication protection enforced at the middleware level.

## Route Structure

### Protected Routes Pattern

All application routes must be accessed via the `/dashboard` prefix:

```
/dashboard              # Main dashboard
/dashboard/workouts     # Workouts list
/dashboard/workout/[id] # Individual workout
/dashboard/profile      # User profile
```

### Public Routes

Only authentication-related routes should remain outside `/dashboard`:

```
/                       # Landing page (redirects to /dashboard if authenticated)
/sign-in               # Clerk sign-in page
/sign-up               # Clerk sign-up page
```

## Route Protection

### Middleware-Based Protection

Route protection is handled exclusively through Next.js middleware using Clerk's `clerkMiddleware()`.

**Location**: `middleware.ts` (root of project)

**Example Implementation**:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### Key Principles

1. **Centralized Protection**: All auth checks happen in `middleware.ts` - never in individual pages or layouts
2. **Pattern Matching**: Use `createRouteMatcher()` to define protected route patterns
3. **Automatic Redirects**: Clerk automatically redirects unauthenticated users to sign-in
4. **No Page-Level Auth**: Avoid using `auth()` or `currentUser()` for route protection in pages

## Standards

### DO ✅

- Protect entire `/dashboard` tree with a single middleware pattern: `/dashboard(.*)`
- Use `createRouteMatcher()` for route patterns
- Call `auth.protect()` for protected routes
- Keep public routes (landing, sign-in, sign-up) outside `/dashboard`
- Use the recommended matcher config to exclude static files

### DON'T ❌

- Don't add route protection in individual page components
- Don't use `redirect()` manually for auth - let Clerk handle it
- Don't create user-facing routes outside `/dashboard` (except auth pages)
- Don't use the deprecated `authMiddleware()` - always use `clerkMiddleware()`
- Don't check auth state in Server Components for route protection

## Migration Guide

If you have unprotected routes that should be protected:

1. Move the route under `/dashboard` directory structure
2. Update all internal links to use new `/dashboard/*` paths
3. Verify middleware pattern `/dashboard(.*)` covers the new route
4. Test that unauthenticated access redirects to sign-in

## Testing Route Protection

Verify protection is working:

1. Sign out of the application
2. Try accessing `/dashboard` or any sub-route directly
3. Should redirect to Clerk's sign-in page
4. After signing in, should redirect back to original destination

## Related Documentation

- [Authentication](/docs/data-mutations.md#authentication) - General auth patterns
- [Server Components](/docs/server-components.md) - Using auth in Server Components

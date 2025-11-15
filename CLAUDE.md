# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 application with TypeScript, React 19, and Tailwind CSS 4. Uses App Router architecture with the latest React and Next.js features.

## IMPORTANT: Documentation-First Approach

**Before generating any code, ALWAYS check the `/docs` directory for relevant documentation files.**

The `/docs` directory contains:
- Feature specifications
- Implementation guidelines
- API references
- Architecture decisions
- Code examples

When implementing a feature or making changes:
1. Search `/docs` for relevant documentation
2. Read and understand the documented approach
3. Follow the patterns and guidelines specified
4. Only deviate from docs if there's a clear technical reason

If documentation is missing or unclear, ask the user before proceeding.

## Development Commands

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture

### App Router Structure
- **app/layout.tsx**: Root layout with Geist font configuration
- **app/page.tsx**: Home page component
- **app/globals.css**: Global Tailwind styles

### Key Configurations
- **TypeScript**: Strict mode enabled, React 19 JSX transform (`jsx: "react-jsx"`), target ES2017
- **Path aliases**: `@/*` maps to project root
- **Module resolution**: Uses bundler mode for Next.js compatibility
- **ESLint**: Flat config format with Next.js core-web-vitals and TypeScript rules

## Authentication (Clerk)

This application uses Clerk for authentication following the Next.js App Router approach.

### Setup Files
- **middleware.ts**: Uses `clerkMiddleware()` from `@clerk/nextjs/server` to protect routes
- **app/layout.tsx**: Wrapped with `<ClerkProvider>` and includes auth UI components in header
- **.env.local**: Contains Clerk environment variables (not tracked in git)

### Environment Variables Required
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
```

Get your keys from: https://dashboard.clerk.com/last-active?path=api-keys

### Important Notes
- Always use `clerkMiddleware()` (NOT the deprecated `authMiddleware()`)
- Import server functions from `@clerk/nextjs/server`
- Import client components from `@clerk/nextjs`
- Auth state checks should use `<SignedIn>` and `<SignedOut>` components or `auth()` function

## TypeScript Notes

- Using React 19's new JSX transform (no need to import React in components)
- Strict mode enabled - all type checking is enforced
- Path alias `@/*` resolves to root directory

## Styling

Tailwind CSS 4 with PostCSS. Supports dark mode via `dark:` prefix classes.

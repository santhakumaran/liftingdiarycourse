# Authentication Coding Standards

## Authentication Provider

### Clerk - REQUIRED

**This application uses Clerk exclusively for all authentication and user management.**

### Critical Rules

1. **ONLY Clerk for Authentication**
   - All authentication features MUST use Clerk
   - Visit [clerk.com](https://clerk.com) for complete documentation
   - No custom authentication implementations allowed

2. **NO Custom Auth Solutions**
   - **ABSOLUTELY NO custom authentication code should be created**
   - Do not build custom login forms, signup flows, or session management from scratch
   - Do not use alternative auth libraries (NextAuth, Auth0, Firebase Auth, etc.)

3. **Clerk Installation**
   - Install Clerk using: `npm install @clerk/nextjs`
   - Configure environment variables in `.env.local`
   - Set up Clerk middleware for route protection

## Clerk Integration

### Environment Variables

Required environment variables (add to `.env.local`):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Customize redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Middleware Setup

Create or update `src/middleware.ts`:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

### Root Layout Integration

Wrap your application with `ClerkProvider` in `src/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## Authentication Components

### Pre-built Components

Clerk provides ready-to-use components:

#### Sign In / Sign Up
```tsx
import { SignIn, SignUp } from '@clerk/nextjs'

// Sign In Page - src/app/sign-in/[[...sign-in]]/page.tsx
export default function SignInPage() {
  return <SignIn />
}

// Sign Up Page - src/app/sign-up/[[...sign-up]]/page.tsx
export default function SignUpPage() {
  return <SignUp />
}
```

#### User Button
```tsx
import { UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <header>
      <nav>
        <UserButton />
      </nav>
    </header>
  )
}
```

#### User Profile
```tsx
import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return <UserProfile />
}
```

## Accessing User Data

### Server Components

Use `auth()` and `currentUser()` in Server Components:

```tsx
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  // Get user ID and session claims
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get full user object
  const user = await currentUser()

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
    </div>
  )
}
```

### Client Components

Use `useUser()` and `useAuth()` hooks in Client Components:

```tsx
'use client'

import { useUser, useAuth } from '@clerk/nextjs'

export default function ProfileCard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <p>Hello, {user.firstName}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

## Route Protection

### Protecting Routes with Middleware

Update `src/middleware.ts` to protect specific routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Protecting Individual Pages

For granular control, check auth in the page component:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Rest of page content
  return <div>Protected content</div>
}
```

## API Route Protection

### Server Actions

```tsx
'use server'

import { auth } from '@clerk/nextjs/server'

export async function createWorkout(data: WorkoutData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Create workout logic
  return { success: true }
}
```

### API Routes

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // API logic
  return NextResponse.json({ data: 'Protected data' })
}
```

## User Metadata

### Accessing User Metadata

```tsx
import { currentUser } from '@clerk/nextjs/server'

export default async function ProfilePage() {
  const user = await currentUser()

  // Public metadata (readable by anyone)
  const publicData = user?.publicMetadata

  // Private metadata (only readable by the user)
  const privateData = user?.privateMetadata

  // Unsafe metadata (managed by Clerk, read-only)
  const unsafeData = user?.unsafeMetadata

  return <div>User preferences: {JSON.stringify(publicMetadata)}</div>
}
```

### Updating User Metadata

```tsx
'use client'

import { useUser } from '@clerk/nextjs'

export default function SettingsForm() {
  const { user } = useUser()

  const updatePreferences = async () => {
    await user?.update({
      unsafeMetadata: {
        preferredUnits: 'kg',
        theme: 'dark',
      },
    })
  }

  return <button onClick={updatePreferences}>Save Preferences</button>
}
```

## Best Practices

### 1. Use Server Components by Default
- Prefer Server Components with `auth()` and `currentUser()`
- Only use Client Components when you need interactivity

### 2. Check Loading States
```tsx
'use client'

import { useUser } from '@clerk/nextjs'

export default function Component() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return <div>{user?.firstName}</div>
}
```

### 3. Handle Unauthenticated States
```tsx
const { userId } = await auth()

if (!userId) {
  redirect('/sign-in')
}
```

### 4. Protect Sensitive Operations
- Always verify `userId` before database operations
- Use Clerk's built-in protection mechanisms
- Never trust client-side authentication alone

### 5. Leverage Clerk's Features
- Multi-factor authentication (MFA)
- Social sign-in providers (Google, GitHub, etc.)
- Email verification
- Password reset flows
- Organization management
- Role-based access control (RBAC)

## Common Patterns

### Conditional Rendering Based on Auth

```tsx
import { auth } from '@clerk/nextjs/server'

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div>
      {userId ? (
        <DashboardView />
      ) : (
        <LandingPage />
      )}
    </div>
  )
}
```

### Getting User Email

```tsx
import { currentUser } from '@clerk/nextjs/server'

export default async function Page() {
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress

  return <p>Email: {email}</p>
}
```

### Sign Out Button

```tsx
'use client'

import { useClerk } from '@clerk/nextjs'

export default function SignOutButton() {
  const { signOut } = useClerk()

  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  )
}
```

## Why Only Clerk?

- **Security** - Industry-standard security practices built-in
- **Compliance** - GDPR, CCPA, and SOC 2 compliant
- **User Experience** - Beautiful, customizable UI components
- **Features** - MFA, social login, organizations, and more
- **Developer Experience** - Simple API, excellent documentation
- **Scalability** - Handles authentication at any scale
- **Maintenance** - No need to maintain auth infrastructure

## Enforcement

This standard is **non-negotiable**:
- Code reviews MUST reject any custom authentication implementations
- All auth MUST use Clerk components and APIs
- No alternative authentication libraries should be installed
- All user session management MUST go through Clerk

## Resources

- **Documentation**: [clerk.com/docs](https://clerk.com/docs)
- **Next.js Quickstart**: [clerk.com/docs/quickstarts/nextjs](https://clerk.com/docs/quickstarts/nextjs)
- **Component Reference**: [clerk.com/docs/components/overview](https://clerk.com/docs/components/overview)
- **API Reference**: [clerk.com/docs/references/nextjs/overview](https://clerk.com/docs/references/nextjs/overview)

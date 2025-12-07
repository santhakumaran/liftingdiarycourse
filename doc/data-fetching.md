# Data Fetching Standards

## Critical Architecture Rule

**ALL data fetching in this application MUST be done via Server Components.**

This is a fundamental architectural decision and is **non-negotiable**.

## Data Fetching Rules

### 1. Server Components ONLY

**All data fetching MUST happen in Server Components.**

#### Allowed:
```tsx
// src/app/workouts/page.tsx - Server Component (DEFAULT)
import { getWorkouts } from '@/data/workouts'

export default async function WorkoutsPage() {
  const workouts = await getWorkouts() // ✅ CORRECT

  return <div>{/* render workouts */}</div>
}
```

#### FORBIDDEN:
```tsx
// ❌ WRONG - Client Component fetching
'use client'
export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([])

  useEffect(() => {
    fetch('/api/workouts') // ❌ NO
      .then(res => res.json())
      .then(setWorkouts)
  }, [])
}

// ❌ WRONG - Route Handler for data
// src/app/api/workouts/route.ts
export async function GET() {
  const workouts = await getWorkouts() // ❌ NO
  return Response.json(workouts)
}
```

### 2. Database Access via /data Directory ONLY

**All database queries MUST be performed through helper functions in the `/data` directory.**

#### Structure:
```
src/
└── data/
    ├── workouts.ts      # Workout-related queries
    ├── exercises.ts     # Exercise-related queries
    ├── users.ts         # User-related queries
    └── ...
```

#### Example Helper Function:
```tsx
// src/data/workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth' // Your auth solution

export async function getWorkouts() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return db.query.workouts.findMany({
    where: eq(workouts.userId, session.user.id),
    orderBy: (workouts, { desc }) => [desc(workouts.date)]
  })
}

export async function getWorkoutById(workoutId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId)
  })

  // Security: Verify the workout belongs to the current user
  if (workout?.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  return workout
}
```

### 3. Drizzle ORM REQUIRED

**All database queries MUST use Drizzle ORM.**

#### ✅ CORRECT - Drizzle ORM:
```tsx
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Query builder syntax
const results = await db.query.workouts.findMany({
  where: eq(workouts.userId, userId),
  orderBy: [desc(workouts.date)]
})

// Or select syntax
const results = await db
  .select()
  .from(workouts)
  .where(eq(workouts.userId, userId))
  .orderBy(desc(workouts.date))
```

#### ❌ FORBIDDEN - Raw SQL:
```tsx
// ❌ NEVER do this
await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`)

// ❌ NEVER do this
await db.raw('SELECT * FROM workouts')

// ❌ NEVER do this
await pool.query('SELECT * FROM workouts WHERE user_id = $1', [userId])
```

### 4. Data Security - User Isolation

**Users MUST ONLY access their own data. This is CRITICAL for security.**

Every data fetching function MUST:
1. Verify the user is authenticated
2. Filter results by the current user's ID
3. Validate ownership before returning individual records

#### Security Pattern:
```tsx
import { auth } from '@/auth'
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getWorkouts() {
  // Step 1: Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Step 2: Filter by user ID
  return db.query.workouts.findMany({
    where: eq(workouts.userId, session.user.id) // CRITICAL
  })
}

export async function getWorkout(id: string) {
  // Step 1: Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Step 2: Get the record
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, id)
  })

  // Step 3: Verify ownership
  if (!workout || workout.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  return workout
}
```

#### Security Anti-Patterns (FORBIDDEN):
```tsx
// ❌ NEVER - No authentication check
export async function getWorkouts() {
  return db.query.workouts.findMany() // Anyone can see all workouts!
}

// ❌ NEVER - No ownership verification
export async function getWorkout(id: string) {
  return db.query.workouts.findFirst({
    where: eq(workouts.id, id) // User could access other users' data!
  })
}

// ❌ NEVER - Taking userId as parameter (can be spoofed)
export async function getWorkouts(userId: string) {
  return db.query.workouts.findMany({
    where: eq(workouts.userId, userId) // Caller could pass any userId!
  })
}
```

## Complete Data Fetching Flow

### 1. Create Helper Function in /data
```tsx
// src/data/exercises.ts
import { auth } from '@/auth'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getExercises() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return db.query.exercises.findMany({
    where: eq(exercises.userId, session.user.id),
    orderBy: (exercises, { asc }) => [asc(exercises.name)]
  })
}
```

### 2. Use in Server Component
```tsx
// src/app/exercises/page.tsx
import { getExercises } from '@/data/exercises'

export default async function ExercisesPage() {
  const exercises = await getExercises()

  return (
    <div>
      {exercises.map(exercise => (
        <div key={exercise.id}>{exercise.name}</div>
      ))}
    </div>
  )
}
```

### 3. Pass Data to Client Components if Needed
```tsx
// src/app/exercises/page.tsx - Server Component
import { getExercises } from '@/data/exercises'
import { ExerciseList } from '@/components/exercise-list'

export default async function ExercisesPage() {
  const exercises = await getExercises() // Fetch in server

  return <ExerciseList exercises={exercises} /> // Pass as props
}

// src/components/exercise-list.tsx - Client Component
'use client'

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  // Receives data as props, can add interactivity
  const [selected, setSelected] = useState<string | null>(null)

  return <div>{/* interactive UI */}</div>
}
```

## Why Server Components for Data Fetching?

### Benefits:
1. **Security** - Credentials and secrets never exposed to client
2. **Performance** - Reduced JavaScript bundle size
3. **SEO** - Server-rendered content is indexable
4. **Simplified Architecture** - No need for API routes for internal data
5. **Type Safety** - Direct database to component without serialization issues
6. **Reduced Latency** - Database queries happen server-side, closer to the database

### When to Use Route Handlers:
Route handlers (`/api` routes) should ONLY be used for:
- **Webhooks** - Receiving external HTTP callbacks
- **External API endpoints** - Third-party integrations
- **Form submissions** - POST requests for mutations
- **File uploads** - Handling multipart form data

Route handlers should **NEVER** be used for fetching data to display in your own UI.

## Mutations (Creating/Updating Data)

For data mutations, use Server Actions, NOT route handlers:

```tsx
// src/app/workouts/actions.ts
'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { revalidatePath } from 'next/cache'

export async function createWorkout(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string

  await db.insert(workouts).values({
    userId: session.user.id,
    name,
    date: new Date()
  })

  revalidatePath('/workouts')
}
```

## Enforcement

These standards are **absolutely critical** for:
- **Security** - Preventing unauthorized data access
- **Performance** - Optimal server-side rendering
- **Maintainability** - Consistent patterns across the codebase

### Code Review Checklist:
- ✅ All data fetching happens in Server Components?
- ✅ All database queries use helper functions in `/data`?
- ✅ All helpers use Drizzle ORM (no raw SQL)?
- ✅ Every helper verifies authentication?
- ✅ Every helper filters by current user ID?
- ✅ Individual record lookups verify ownership?

**Any code that violates these standards MUST be rejected.**

## Resources

- **Next.js Server Components**: [nextjs.org/docs/app/building-your-application/rendering/server-components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- **Drizzle ORM Queries**: [orm.drizzle.team/docs/rqb](https://orm.drizzle.team/docs/rqb)
- **Next.js Server Actions**: [nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

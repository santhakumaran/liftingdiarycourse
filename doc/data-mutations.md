# Data Mutations Coding Standards

## Overview

**This application enforces a strict three-layer architecture for all data mutations:**

1. **Server Actions Layer** (`actions.ts` files) - User-facing API with validation
2. **Data Helper Layer** (`src/data/*` files) - Business logic and database operations
3. **Database Layer** (Drizzle ORM) - Type-safe database queries

## Critical Rules

### 1. Server Actions - REQUIRED

**All data mutations MUST be performed through Server Actions.**

- Server Actions MUST be defined in colocated `actions.ts` files
- Server Actions MUST use the `'use server'` directive
- Server Actions MUST validate all arguments using Zod
- Server Actions params MUST be explicitly typed
- Server Actions params MUST NOT use the `FormData` type

### 2. Data Helpers - REQUIRED

**All database operations MUST go through helper functions in `src/data/`.**

- Helper functions wrap all Drizzle ORM database calls
- Direct database queries outside `src/data/` are FORBIDDEN
- Each entity (workouts, exercises, etc.) has its own data helper file

### 3. Drizzle ORM - REQUIRED

**All database interactions MUST use Drizzle ORM.**

- Drizzle provides type-safe database queries
- No raw SQL queries (except where absolutely necessary)
- Schema definitions live in `src/db/schema.ts`

### 4. Zod Validation - REQUIRED

**All Server Action parameters MUST be validated with Zod schemas.**

- Define Zod schemas for all input data
- Validate before calling data helpers
- Return proper error messages on validation failure

## Architecture Layers

### Layer 1: Server Actions (Public API)

**Location**: Colocated `actions.ts` files near the components that use them

**Purpose**:
- User-facing API for data mutations
- Input validation
- Error handling
- Authentication checks

**Example**: `src/app/workouts/actions.ts`

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts'

// Define Zod schemas for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  date: z.date(),
  notes: z.string().optional(),
})

const updateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  date: z.date().optional(),
  notes: z.string().optional(),
})

const deleteWorkoutSchema = z.object({
  id: z.string().uuid(),
})

// Server Action - Create Workout
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // 1. Authenticate user
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Validate input
  const validation = createWorkoutSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid input'
    }
  }

  // 3. Call data helper
  try {
    const workout = await createWorkout({
      userId,
      ...validation.data,
    })

    // 4. Revalidate cache
    revalidatePath('/workouts')

    return { success: true, data: workout }
  } catch (error) {
    console.error('Failed to create workout:', error)
    return { success: false, error: 'Failed to create workout' }
  }
}

// Server Action - Update Workout
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = updateWorkoutSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid input'
    }
  }

  try {
    const workout = await updateWorkout(validation.data.id, validation.data, userId)
    revalidatePath('/workouts')
    revalidatePath(`/workouts/${validation.data.id}`)

    return { success: true, data: workout }
  } catch (error) {
    console.error('Failed to update workout:', error)
    return { success: false, error: 'Failed to update workout' }
  }
}

// Server Action - Delete Workout
export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = deleteWorkoutSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    await deleteWorkout(validation.data.id, userId)
    revalidatePath('/workouts')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete workout:', error)
    return { success: false, error: 'Failed to delete workout' }
  }
}
```

### Layer 2: Data Helpers (Business Logic)

**Location**: `src/data/` directory

**Purpose**:
- Encapsulate all database operations
- Implement business logic
- Provide reusable database functions
- Handle authorization at the data level

**Example**: `src/data/workouts.ts`

```typescript
import { db } from '@/db'
import { workouts, exercises } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Create a new workout
export async function createWorkout(data: {
  userId: string
  name: string
  date: Date
  notes?: string
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      date: data.date,
      notes: data.notes,
    })
    .returning()

  return workout
}

// Get workout by ID
export async function getWorkoutById(id: string, userId: string) {
  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, id),
      eq(workouts.userId, userId)
    ),
    with: {
      exercises: true,
    },
  })

  return workout
}

// Get all workouts for a user
export async function getWorkoutsByUserId(userId: string) {
  const userWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.date)],
    with: {
      exercises: true,
    },
  })

  return userWorkouts
}

// Update workout
export async function updateWorkout(
  id: string,
  data: {
    name?: string
    date?: Date
    notes?: string
  },
  userId: string
) {
  const [workout] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, userId)
      )
    )
    .returning()

  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  return workout
}

// Delete workout
export async function deleteWorkout(id: string, userId: string) {
  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, userId)
      )
    )
    .returning()

  if (result.length === 0) {
    throw new Error('Workout not found or unauthorized')
  }

  return result[0]
}

// Add exercise to workout
export async function addExerciseToWorkout(data: {
  workoutId: string
  name: string
  sets: number
  reps: number
  weight?: number
  userId: string
}) {
  // First verify the workout belongs to the user
  const workout = await getWorkoutById(data.workoutId, data.userId)
  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  const [exercise] = await db
    .insert(exercises)
    .values({
      workoutId: data.workoutId,
      name: data.name,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
    })
    .returning()

  return exercise
}
```

### Layer 3: Database (Drizzle ORM)

**Location**:
- Schema: `src/db/schema.ts`
- Database instance: `src/db/index.ts`

**Purpose**:
- Define database schema
- Provide type-safe query builder
- Handle database connections

**Example**: `src/db/schema.ts`

```typescript
import { pgTable, text, timestamp, integer, uuid, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(exercises),
}))

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
  }),
}))
```

## File Structure

```
src/
├── app/
│   └── workouts/
│       ├── actions.ts           # Server Actions for workouts
│       ├── page.tsx             # Workouts page
│       └── [id]/
│           ├── actions.ts       # Server Actions for individual workout
│           └── page.tsx         # Individual workout page
├── data/
│   ├── workouts.ts              # Workout data helpers
│   ├── exercises.ts             # Exercise data helpers
│   └── users.ts                 # User data helpers
└── db/
    ├── index.ts                 # Database instance
    └── schema.ts                # Database schema
```

## Validation Standards

### Zod Schema Patterns

#### String Validation
```typescript
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .trim()

const emailSchema = z.string()
  .email('Invalid email address')

const urlSchema = z.string()
  .url('Invalid URL')
```

#### Number Validation
```typescript
const weightSchema = z.number()
  .positive('Weight must be positive')
  .max(1000, 'Weight must be less than 1000')

const setsSchema = z.number()
  .int('Sets must be a whole number')
  .min(1, 'At least 1 set required')
  .max(50, 'Maximum 50 sets allowed')
```

#### Date Validation
```typescript
const dateSchema = z.date()
  .min(new Date('2000-01-01'), 'Date too far in the past')
  .max(new Date('2100-12-31'), 'Date too far in the future')

// Or coerce from string
const dateFromStringSchema = z.coerce.date()
```

#### Optional Fields
```typescript
const notesSchema = z.string().optional()

// Or with default value
const statusSchema = z.string().default('active')
```

#### Arrays
```typescript
const exercisesSchema = z.array(
  z.object({
    name: z.string().min(1),
    sets: z.number().int().min(1),
    reps: z.number().int().min(1),
  })
).min(1, 'At least one exercise required')
```

#### Enums
```typescript
const unitSchema = z.enum(['kg', 'lbs'])

const difficultySchema = z.enum(['easy', 'medium', 'hard'])
```

### Validation Error Handling

```typescript
export async function createWorkoutAction(input: unknown) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = createWorkoutSchema.safeParse(input)

  if (!validation.success) {
    // Return the first error message
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid input'
    }
  }

  // Or return all errors
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }
  }

  // Continue with validated data
  const data = await createWorkout({
    userId,
    ...validation.data,
  })

  return { success: true, data }
}
```

## Return Type Patterns

### Success/Error Pattern

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
): Promise<ActionResult<Workout>> {
  // Implementation
}
```

### Using in Components

```tsx
'use client'

import { createWorkoutAction } from './actions'
import { useState } from 'react'

export function CreateWorkoutForm() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createWorkoutAction({
      name: formData.get('name') as string,
      date: new Date(formData.get('date') as string),
      notes: formData.get('notes') as string,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    // Handle success
    console.log('Workout created:', result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
    </form>
  )
}
```

## Best Practices

### 1. Always Validate User Ownership

```typescript
export async function updateWorkout(id: string, data: object, userId: string) {
  // Always check userId in WHERE clause
  const [workout] = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, userId) // Critical for security
      )
    )
    .returning()

  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  return workout
}
```

### 2. Use Transactions for Related Operations

```typescript
export async function createWorkoutWithExercises(data: {
  userId: string
  name: string
  date: Date
  exercises: Array<{ name: string; sets: number; reps: number }>
}) {
  return await db.transaction(async (tx) => {
    // Create workout
    const [workout] = await tx
      .insert(workouts)
      .values({
        userId: data.userId,
        name: data.name,
        date: data.date,
      })
      .returning()

    // Create exercises
    const createdExercises = await tx
      .insert(exercises)
      .values(
        data.exercises.map(ex => ({
          workoutId: workout.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
        }))
      )
      .returning()

    return { workout, exercises: createdExercises }
  })
}
```

### 3. Revalidate Cache After Mutations

```typescript
import { revalidatePath } from 'next/cache'

export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  // ... validation and deletion logic

  // Revalidate all affected paths
  revalidatePath('/workouts')
  revalidatePath('/dashboard')

  return { success: true }
}
```

### 4. Type Server Action Parameters Explicitly

```typescript
// ✅ CORRECT - Explicitly typed parameters
export async function createWorkoutAction(input: {
  name: string
  date: Date
  notes?: string
}) {
  // Implementation
}

// ✅ CORRECT - Using Zod inferred types
export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  // Implementation
}

// ❌ WRONG - Using FormData
export async function createWorkoutAction(formData: FormData) {
  // DO NOT DO THIS
}

// ❌ WRONG - Untyped parameters
export async function createWorkoutAction(input: any) {
  // DO NOT DO THIS
}
```

### 5. Handle Errors Gracefully

```typescript
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validation = createWorkoutSchema.safeParse(input)
    if (!validation.success) {
      return { success: false, error: 'Invalid input' }
    }

    const workout = await createWorkout({ userId, ...validation.data })
    revalidatePath('/workouts')

    return { success: true, data: workout }
  } catch (error) {
    // Log error for debugging
    console.error('Create workout failed:', error)

    // Return user-friendly message
    return { success: false, error: 'Failed to create workout' }
  }
}
```

## Common Patterns

### Pagination

```typescript
export async function getWorkoutsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize

  const [items, totalCount] = await Promise.all([
    db.query.workouts.findMany({
      where: eq(workouts.userId, userId),
      limit: pageSize,
      offset,
      orderBy: [desc(workouts.date)],
    }),
    db.select({ count: count() })
      .from(workouts)
      .where(eq(workouts.userId, userId)),
  ])

  return {
    items,
    totalPages: Math.ceil(totalCount[0].count / pageSize),
    currentPage: page,
  }
}
```

### Filtering and Sorting

```typescript
export async function getWorkouts(
  userId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    search?: string
  }
) {
  const conditions = [eq(workouts.userId, userId)]

  if (filters?.startDate) {
    conditions.push(gte(workouts.date, filters.startDate))
  }

  if (filters?.endDate) {
    conditions.push(lte(workouts.date, filters.endDate))
  }

  if (filters?.search) {
    conditions.push(ilike(workouts.name, `%${filters.search}%`))
  }

  return await db.query.workouts.findMany({
    where: and(...conditions),
    orderBy: [desc(workouts.date)],
  })
}
```

### Soft Deletes

```typescript
// Add deletedAt to schema
export const workouts = pgTable('workouts', {
  // ... other fields
  deletedAt: timestamp('deleted_at'),
})

// Soft delete function
export async function softDeleteWorkout(id: string, userId: string) {
  const [workout] = await db
    .update(workouts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, userId),
        isNull(workouts.deletedAt) // Not already deleted
      )
    )
    .returning()

  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  return workout
}

// Query only non-deleted
export async function getActiveWorkouts(userId: string) {
  return await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      isNull(workouts.deletedAt)
    ),
  })
}
```

## Enforcement

This standard is **non-negotiable**:

- ✅ All data mutations MUST use Server Actions in `actions.ts` files
- ✅ All database operations MUST go through `src/data/` helpers
- ✅ All Server Action params MUST be validated with Zod
- ✅ Server Action params MUST be explicitly typed (NO `FormData` type)
- ✅ All Server Actions MUST use `'use server'` directive
- ❌ NO direct database queries outside `src/data/` directory
- ❌ NO Server Actions without Zod validation
- ❌ NO untyped Server Action parameters

## Resources

- **Drizzle ORM**: [orm.drizzle.team](https://orm.drizzle.team)
- **Zod**: [zod.dev](https://zod.dev)
- **Next.js Server Actions**: [nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

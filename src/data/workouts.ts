import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { startOfDay, endOfDay } from 'date-fns'

/**
 * Get all workouts for the currently logged in user
 */
export async function getWorkouts() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: (workouts, { desc }) => [desc(workouts.startedAt)],
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  })
}

/**
 * Get workouts for a specific date for the currently logged in user
 */
export async function getWorkoutsByDate(date: Date) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const start = startOfDay(date)
  const end = endOfDay(date)

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, start),
      lte(workouts.startedAt, end)
    ),
    orderBy: (workouts, { desc }) => [desc(workouts.startedAt)],
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  })
}

/**
 * Get a single workout by ID for the currently logged in user
 */
export async function getWorkoutById(workoutId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  })

  // Security: Verify the workout belongs to the current user
  if (!workout || workout.userId !== userId) {
    throw new Error('Unauthorized')
  }

  return workout
}

/**
 * Create a new workout for the currently logged in user
 */
export async function createWorkout(data: {
  userId: string
  name?: string
  startedAt: Date
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      startedAt: data.startedAt,
    })
    .returning()

  return workout
}

/**
 * Update an existing workout for the currently logged in user
 */
export async function updateWorkout(
  workoutId: string,
  data: {
    name?: string
    startedAt?: Date
  }
) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const [workout] = await db
    .update(workouts)
    .set({
      name: data.name,
      startedAt: data.startedAt,
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning()

  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  return workout
}

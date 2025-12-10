import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { workouts, workoutExercises, sets } from '@/db/schema'
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

/**
 * Add exercise to workout
 * Automatically assigns order based on existing exercises
 */
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string
) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify workout belongs to user
  const workout = await getWorkoutById(workoutId)
  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  // Get next order number
  const existingExercises = await db.query.workoutExercises.findMany({
    where: eq(workoutExercises.workoutId, workoutId),
    orderBy: (workoutExercises, { desc }) => [desc(workoutExercises.order)],
    limit: 1,
  })

  const nextOrder = existingExercises.length > 0
    ? (existingExercises[0].order + 1)
    : 0

  const [workoutExercise] = await db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId,
      order: nextOrder,
    })
    .returning()

  return workoutExercise
}

/**
 * Delete a workout exercise
 * Only allows deletion if there are no sets
 */
export async function deleteWorkoutExercise(workoutExerciseId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Get workout exercise with sets
  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: {
      workout: true,
      sets: true,
    },
  })

  if (!workoutExercise) {
    throw new Error('Exercise not found')
  }

  // Verify ownership
  if (workoutExercise.workout.userId !== userId) {
    throw new Error('Unauthorized')
  }

  // Only allow deletion if there are no sets
  if (workoutExercise.sets.length > 0) {
    throw new Error('Cannot delete exercise with existing sets. Delete all sets first.')
  }

  await db
    .delete(workoutExercises)
    .where(eq(workoutExercises.id, workoutExerciseId))

  return { success: true }
}

/**
 * Add a set to a workout exercise
 */
export async function addSet(data: {
  workoutExerciseId: string
  weightKg: string | null
  reps: number
  restTime: number | null
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify ownership through workout
  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, data.workoutExerciseId),
    with: {
      workout: true,
      sets: {
        orderBy: (sets, { desc }) => [desc(sets.setNumber)],
        limit: 1,
      },
    },
  })

  if (!workoutExercise) {
    throw new Error('Exercise not found')
  }

  if (workoutExercise.workout.userId !== userId) {
    throw new Error('Unauthorized')
  }

  // Calculate next set number
  const nextSetNumber = workoutExercise.sets.length > 0
    ? workoutExercise.sets[0].setNumber + 1
    : 1

  const [set] = await db
    .insert(sets)
    .values({
      workoutExerciseId: data.workoutExerciseId,
      setNumber: nextSetNumber,
      weightKg: data.weightKg,
      reps: data.reps,
      restTime: data.restTime,
    })
    .returning()

  return set
}

/**
 * Delete a set
 */
export async function deleteSet(setId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const set = await db.query.sets.findFirst({
    where: eq(sets.id, setId),
    with: {
      workoutExercise: {
        with: {
          workout: true,
        },
      },
    },
  })

  if (!set) {
    throw new Error('Set not found')
  }

  if (set.workoutExercise.workout.userId !== userId) {
    throw new Error('Unauthorized')
  }

  await db.delete(sets).where(eq(sets.id, setId))

  return { success: true }
}

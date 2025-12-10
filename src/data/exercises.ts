import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { eq, ilike } from 'drizzle-orm'

/**
 * Get all exercises (global catalog)
 * Note: Exercises are shared across all users
 */
export async function getExercises() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return db.query.exercises.findMany({
    orderBy: (exercises, { asc }) => [asc(exercises.name)],
  })
}

/**
 * Search exercises by name
 */
export async function searchExercises(searchTerm: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return db.query.exercises.findMany({
    where: ilike(exercises.name, `%${searchTerm}%`),
    orderBy: (exercises, { asc }) => [asc(exercises.name)],
    limit: 10,
  })
}

/**
 * Create a new exercise in the global catalog
 * Returns existing exercise if name already exists (case-insensitive)
 */
export async function createExercise(name: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Check if exercise already exists (case-insensitive)
  const existing = await db.query.exercises.findFirst({
    where: ilike(exercises.name, name),
  })

  if (existing) {
    return existing
  }

  const [exercise] = await db
    .insert(exercises)
    .values({ name: name.trim() })
    .returning()

  return exercise
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(exerciseId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
  })
}

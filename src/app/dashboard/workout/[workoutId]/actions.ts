'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  updateWorkout,
  addExerciseToWorkout,
  addSet,
  deleteSet,
  deleteWorkoutExercise,
} from '@/data/workouts'
import { createExercise } from '@/data/exercises'

const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
  startedAt: z.coerce.date(),
})

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = updateWorkoutSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid input'
    }
  }

  try {
    const workout = await updateWorkout(validation.data.workoutId, {
      name: validation.data.name,
      startedAt: validation.data.startedAt,
    })

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/workout/${validation.data.workoutId}`)

    return { success: true, workoutId: workout.id }
  } catch (error) {
    console.error('Failed to update workout:', error)
    return { success: false, error: 'Failed to update workout' }
  }
}

// Add Exercise to Workout
const addExerciseSchema = z.object({
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid().optional(),
  exerciseName: z.string().min(1).max(200).trim().optional(),
}).refine(
  (data) => data.exerciseId || data.exerciseName,
  { message: 'Either exerciseId or exerciseName must be provided' }
)

export async function addExerciseToWorkoutAction(
  input: z.infer<typeof addExerciseSchema>
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = addExerciseSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid input',
    }
  }

  try {
    let exerciseId = validation.data.exerciseId

    // Create new exercise if name provided instead of ID
    if (!exerciseId && validation.data.exerciseName) {
      const exercise = await createExercise(validation.data.exerciseName)
      exerciseId = exercise.id
    }

    if (!exerciseId) {
      return { success: false, error: 'Exercise ID is required' }
    }

    const workoutExercise = await addExerciseToWorkout(
      validation.data.workoutId,
      exerciseId
    )

    revalidatePath(`/dashboard/workout/${validation.data.workoutId}`)

    return { success: true, data: workoutExercise }
  } catch (error) {
    console.error('Failed to add exercise:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add exercise'
    }
  }
}

// Add Set
const addSetSchema = z.object({
  workoutId: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
  weightKg: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Weight must be a valid number')
    .optional()
    .nullable(),
  reps: z.number()
    .int('Reps must be a whole number')
    .min(1, 'At least 1 rep required')
    .max(1000, 'Maximum 1000 reps'),
  restTime: z.number()
    .int('Rest time must be whole seconds')
    .min(0, 'Rest time cannot be negative')
    .max(3600, 'Rest time must be less than 1 hour')
    .optional()
    .nullable(),
})

export async function addSetAction(input: z.infer<typeof addSetSchema>) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = addSetSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid input',
    }
  }

  try {
    const set = await addSet({
      workoutExerciseId: validation.data.workoutExerciseId,
      weightKg: validation.data.weightKg || null,
      reps: validation.data.reps,
      restTime: validation.data.restTime || null,
    })

    revalidatePath(`/dashboard/workout/${validation.data.workoutId}`)

    return { success: true, data: set }
  } catch (error) {
    console.error('Failed to add set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add set'
    }
  }
}

// Delete Set
const deleteSetSchema = z.object({
  workoutId: z.string().uuid(),
  setId: z.string().uuid(),
})

export async function deleteSetAction(input: z.infer<typeof deleteSetSchema>) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = deleteSetSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    await deleteSet(validation.data.setId)

    revalidatePath(`/dashboard/workout/${validation.data.workoutId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete set'
    }
  }
}

// Delete Workout Exercise (only if no sets)
const deleteWorkoutExerciseSchema = z.object({
  workoutId: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
})

export async function deleteWorkoutExerciseAction(
  input: z.infer<typeof deleteWorkoutExerciseSchema>
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = deleteWorkoutExerciseSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    await deleteWorkoutExercise(validation.data.workoutExerciseId)

    revalidatePath(`/dashboard/workout/${validation.data.workoutId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete exercise:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete exercise'
    }
  }
}

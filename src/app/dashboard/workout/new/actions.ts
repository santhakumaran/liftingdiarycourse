'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createWorkout } from '@/data/workouts'

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
  startedAt: z.coerce.date(),
})

export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = createWorkoutSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid input'
    }
  }

  try {
    const workout = await createWorkout({
      userId,
      name: validation.data.name,
      startedAt: validation.data.startedAt,
    })

    revalidatePath('/dashboard')

    return { success: true, workoutId: workout.id }
  } catch (error) {
    console.error('Failed to create workout:', error)
    return { success: false, error: 'Failed to create workout' }
  }
}

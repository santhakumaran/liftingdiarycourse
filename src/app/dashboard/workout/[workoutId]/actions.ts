'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateWorkout } from '@/data/workouts'

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

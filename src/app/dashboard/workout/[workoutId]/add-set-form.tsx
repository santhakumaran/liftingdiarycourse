'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addSetAction } from './actions'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  weightKg: z.string().optional(),
  reps: z.string().min(1, 'Reps required'),
  restTime: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddSetFormProps {
  workoutExerciseId: string
  workoutId: string
}

export function AddSetForm({ workoutExerciseId, workoutId }: AddSetFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weightKg: '',
      reps: '',
      restTime: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setIsSubmitting(true)

    // Validate and convert reps
    const reps = parseInt(values.reps, 10)
    if (isNaN(reps) || reps < 1 || reps > 1000) {
      setError('Reps must be a number between 1 and 1000')
      setIsSubmitting(false)
      return
    }

    // Validate weight if provided
    let weightKg: string | null = null
    if (values.weightKg && values.weightKg.trim() !== '') {
      const weightRegex = /^\d+(\.\d{1,2})?$/
      if (!weightRegex.test(values.weightKg)) {
        setError('Weight must be a valid number with up to 2 decimal places')
        setIsSubmitting(false)
        return
      }
      weightKg = values.weightKg
    }

    // Validate rest time if provided
    let restTime: number | null = null
    if (values.restTime && values.restTime.trim() !== '') {
      restTime = parseInt(values.restTime, 10)
      if (isNaN(restTime) || restTime < 0 || restTime > 3600) {
        setError('Rest time must be a number between 0 and 3600 seconds')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const result = await addSetAction({
        workoutId,
        workoutExerciseId,
        weightKg,
        reps,
        restTime,
      })

      if (!result.success) {
        setError(result.error || 'Failed to add set')
        setIsSubmitting(false)
      } else {
        // Reset form after successful submission
        form.reset({
          weightKg: values.weightKg, // Keep weight for convenience
          reps: '',
          restTime: values.restTime, // Keep rest time for convenience
        })
        setIsSubmitting(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Add Set</h4>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-4 gap-3 items-end">
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reps"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Reps *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="restTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Rest (s)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </form>
      </Form>
    </div>
  )
}

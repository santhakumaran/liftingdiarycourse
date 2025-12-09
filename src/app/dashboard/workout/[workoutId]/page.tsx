'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { updateWorkoutAction } from './actions'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  startedAt: z.string().min(1, 'Date is required'),
})

type FormValues = z.infer<typeof formSchema>

interface EditWorkoutPageProps {
  params: Promise<{
    workoutId: string
  }>
}

export default function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [workoutId, setWorkoutId] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startedAt: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    async function loadWorkout() {
      try {
        const resolvedParams = await params
        setWorkoutId(resolvedParams.workoutId)

        const response = await fetch(`/api/workouts/${resolvedParams.workoutId}`)

        if (!response.ok) {
          throw new Error('Failed to load workout')
        }

        const workout = await response.json()

        form.reset({
          name: workout.name || '',
          startedAt: format(new Date(workout.startedAt), 'yyyy-MM-dd'),
        })

        setIsLoading(false)
      } catch (err) {
        setError('Failed to load workout')
        setIsLoading(false)
      }
    }

    loadWorkout()
  }, [params, form])

  const onSubmit = async (values: FormValues) => {
    if (!workoutId) {
      setError('Workout ID not found')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await updateWorkoutAction({
        workoutId,
        name: values.name,
        startedAt: new Date(values.startedAt),
      })

      if (!result.success) {
        setError(result.error || 'Failed to update workout')
        setIsSubmitting(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading workout...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Morning Push Day"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? 'Updating...' : 'Update Workout'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

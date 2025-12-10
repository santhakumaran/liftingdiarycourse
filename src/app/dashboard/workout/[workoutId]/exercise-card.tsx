'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteWorkoutExerciseAction } from './actions'
import { SetList } from './set-list'
import { AddSetForm } from './add-set-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface WorkoutExercise {
  id: string
  exercise: {
    id: string
    name: string
  }
  sets: Array<{
    id: string
    setNumber: number
    weightKg: string | null
    reps: number
    restTime: number | null
  }>
}

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise
  workoutId: string
}

export function ExerciseCard({ workoutExercise, workoutId }: ExerciseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteExercise = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      const result = await deleteWorkoutExerciseAction({
        workoutId,
        workoutExerciseId: workoutExercise.id,
      })

      if (!result.success) {
        setError(result.error || 'Failed to delete exercise')
        setIsDeleting(false)
      } else {
        setIsDeleting(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{workoutExercise.exercise.name}</CardTitle>
          {workoutExercise.sets.length === 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {workoutExercise.exercise.name} from this workout? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteExercise}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <SetList sets={workoutExercise.sets} workoutId={workoutId} />

        <Separator />

        <AddSetForm
          workoutExerciseId={workoutExercise.id}
          workoutId={workoutId}
        />
      </CardContent>
    </Card>
  )
}

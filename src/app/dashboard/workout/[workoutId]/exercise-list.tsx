'use client'

import { ExerciseCard } from './exercise-card'

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

interface ExerciseListProps {
  workoutExercises: WorkoutExercise[]
  workoutId: string
}

export function ExerciseList({ workoutExercises, workoutId }: ExerciseListProps) {
  if (workoutExercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No exercises yet. Add an exercise above to get started.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {workoutExercises.map((workoutExercise) => (
        <ExerciseCard
          key={workoutExercise.id}
          workoutExercise={workoutExercise}
          workoutId={workoutId}
        />
      ))}
    </div>
  )
}

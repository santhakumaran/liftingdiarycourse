import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getWorkoutById } from '@/data/workouts'
import { getExercises } from '@/data/exercises'
import { WorkoutDetailsForm } from './workout-details-form'
import { ExerciseCombobox } from './exercise-combobox'
import { ExerciseList } from './exercise-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string
  }>
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { workoutId } = await params

  // Fetch data in parallel
  const [workout, allExercises] = await Promise.all([
    getWorkoutById(workoutId),
    getExercises(),
  ])

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      {/* Workout Details Section */}
      <WorkoutDetailsForm workout={workout} />

      <Separator />

      {/* Exercises Section */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Exercise Combobox */}
          <ExerciseCombobox
            exercises={allExercises}
            workoutId={workoutId}
          />

          {/* Exercise List */}
          <ExerciseList
            workoutExercises={workout.workoutExercises}
            workoutId={workoutId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { format, parseISO } from 'date-fns'
import { getWorkoutsByDate } from '@/data/workouts'
import { DashboardCalendar } from '@/components/dashboard-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const dateParam = params.date
  const selectedDate = dateParam ? parseISO(dateParam) : new Date()

  const workouts = await getWorkoutsByDate(selectedDate)

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Workout Dashboard</h1>
        <p className="text-muted-foreground">
          Track your workouts for {format(selectedDate, 'do MMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCalendar />

        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Workouts for {format(selectedDate, 'do MMM yyyy')}
            </h2>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <CardTitle>{workout.name || 'Untitled Workout'}</CardTitle>
                    <CardDescription>
                      Started: {format(workout.startedAt, 'h:mm a')}
                      {workout.completedAt && ` • Completed: ${format(workout.completedAt, 'h:mm a')}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium mb-2">Exercises:</p>
                      {workout.workoutExercises.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {workout.workoutExercises.map((we) => (
                            <li key={we.id} className="text-sm text-muted-foreground">
                              {we.exercise.name} ({we.sets.length} {we.sets.length === 1 ? 'set' : 'sets'})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No exercises logged</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No workouts logged for this date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

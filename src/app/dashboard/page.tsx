'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const mockWorkouts = [
    {
      id: 1,
      name: 'Morning Strength Training',
      exercises: ['Bench Press', 'Squats', 'Deadlifts'],
      duration: '45 min',
    },
    {
      id: 2,
      name: 'Evening Cardio',
      exercises: ['Running', 'Jump Rope'],
      duration: '30 min',
    },
    {
      id: 3,
      name: 'Core Workout',
      exercises: ['Planks', 'Crunches', 'Russian Twists'],
      duration: '20 min',
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Workout Dashboard</h1>
        <p className="text-muted-foreground">
          Track your workouts for {format(selectedDate, 'do MMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view workouts</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Workouts for {format(selectedDate, 'do MMM yyyy')}
            </h2>
          </div>

          {mockWorkouts.length > 0 ? (
            <div className="space-y-4">
              {mockWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <CardTitle>{workout.name}</CardTitle>
                    <CardDescription>Duration: {workout.duration}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium mb-2">Exercises:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {workout.exercises.map((exercise, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {exercise}
                          </li>
                        ))}
                      </ul>
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

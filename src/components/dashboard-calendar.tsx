'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardCalendar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const dateParam = searchParams.get('date')
  const selectedDate = dateParam ? parseISO(dateParam) : new Date()

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      router.push(`/dashboard?date=${formattedDate}`)
    }
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
        <CardDescription>Choose a date to view workouts</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteSetAction } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Set {
  id: string
  setNumber: number
  weightKg: string | null
  reps: number
  restTime: number | null
}

interface SetListProps {
  sets: Set[]
  workoutId: string
}

export function SetList({ sets, workoutId }: SetListProps) {
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (setId: string) => {
    setError(null)
    setDeletingSetId(setId)

    try {
      const result = await deleteSetAction({
        workoutId,
        setId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to delete set')
        setDeletingSetId(null)
      } else {
        setDeletingSetId(null)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setDeletingSetId(null)
    }
  }

  if (sets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No sets yet. Add a set below.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Set</th>
              <th className="text-left py-2 px-2">Weight (kg)</th>
              <th className="text-left py-2 px-2">Reps</th>
              <th className="text-left py-2 px-2">Rest (s)</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => (
              <tr key={set.id} className="border-b last:border-0">
                <td className="py-2 px-2">
                  <Badge variant="outline">{set.setNumber}</Badge>
                </td>
                <td className="py-2 px-2">{set.weightKg || '-'}</td>
                <td className="py-2 px-2">{set.reps}</td>
                <td className="py-2 px-2">{set.restTime || '-'}</td>
                <td className="py-2 px-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingSetId === set.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Set?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete Set {set.setNumber}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(set.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { addExerciseToWorkoutAction } from './actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Exercise {
  id: string
  name: string
}

interface ExerciseComboboxProps {
  exercises: Exercise[]
  workoutId: string
}

export function ExerciseCombobox({ exercises, workoutId }: ExerciseComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelectExercise = async (exerciseId: string) => {
    setError(null)
    setIsAdding(true)
    setOpen(false)

    try {
      const result = await addExerciseToWorkoutAction({
        workoutId,
        exerciseId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to add exercise')
      } else {
        setSearchValue('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCreateExercise = async () => {
    if (!searchValue.trim()) return

    setError(null)
    setIsAdding(true)
    setOpen(false)

    try {
      const result = await addExerciseToWorkoutAction({
        workoutId,
        exerciseName: searchValue.trim(),
      })

      if (!result.success) {
        setError(result.error || 'Failed to create exercise')
      } else {
        setSearchValue('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isAdding}
          >
            {isAdding ? 'Adding exercise...' : 'Add exercise to workout'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create exercise..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {searchValue.trim() ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleCreateExercise}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create &quot;{searchValue.trim()}&quot;
                    </Button>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">
                    Type to search or create an exercise
                  </p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredExercises.map((exercise) => (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.id}
                    onSelect={() => handleSelectExercise(exercise.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        'opacity-0'
                      )}
                    />
                    {exercise.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchValue.trim() && filteredExercises.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={handleCreateExercise}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create &quot;{searchValue.trim()}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

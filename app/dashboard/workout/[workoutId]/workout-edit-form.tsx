'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { updateWorkoutAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Workout = {
  id: number;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface WorkoutEditFormProps {
  workout: Workout;
}

export function WorkoutEditForm({ workout }: WorkoutEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format dates for datetime-local inputs
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const startedAt = formData.get('startedAt') as string;
    const completedAt = formData.get('completedAt') as string;

    startTransition(async () => {
      try {
        const result = await updateWorkoutAction({
          workoutId: workout.id,
          name: name || undefined,
          startedAt: startedAt || undefined,
          completedAt: completedAt || null,
        });

        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Failed to update workout');
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Workout Name (Optional)</Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="e.g., Morning Chest Day"
              defaultValue={workout.name || ''}
              maxLength={255}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Leave blank to auto-generate a name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startedAt">Start Time</Label>
            <Input
              type="datetime-local"
              id="startedAt"
              name="startedAt"
              defaultValue={formatDateForInput(workout.startedAt)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedAt">Completed Time (Optional)</Label>
            <Input
              type="datetime-local"
              id="completedAt"
              name="completedAt"
              defaultValue={formatDateForInput(workout.completedAt)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Leave blank if workout is still in progress
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

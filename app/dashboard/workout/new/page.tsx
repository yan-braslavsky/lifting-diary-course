'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkoutAction } from './actions';

export default function NewWorkoutPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const startedAt = formData.get('startedAt') as string;

    startTransition(async () => {
      try {
        const result = await createWorkoutAction({
          name: name || undefined,
          startedAt: startedAt || new Date().toISOString(),
        });

        if (result.success) {
          // Redirect client-side after successful creation
          router.push('/dashboard');
        } else {
          setError(result.error || 'Failed to create workout');
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred');
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Workout</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start a new workout session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-2"
          >
            Workout Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="e.g., Morning Chest Day"
            maxLength={255}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leave blank to auto-generate a name
          </p>
        </div>

        <div>
          <label
            htmlFor="startedAt"
            className="block text-sm font-medium mb-2"
          >
            Start Time
          </label>
          <input
            type="datetime-local"
            id="startedAt"
            name="startedAt"
            defaultValue={new Date().toISOString().slice(0, 16)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isPending ? 'Creating...' : 'Create Workout'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={isPending}
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

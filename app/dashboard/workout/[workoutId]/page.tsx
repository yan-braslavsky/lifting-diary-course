import { notFound } from 'next/navigation';
import { getUserWorkoutById } from '@/data/workouts';
import { WorkoutEditForm } from './workout-edit-form';

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    notFound();
  }

  const workout = await getUserWorkoutById(workoutIdNum);

  if (!workout) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Workout</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your workout details
        </p>
      </div>

      <WorkoutEditForm workout={workout} />
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type WorkoutExercise = {
  id: number;
  order: number;
  exercise: {
    id: number;
    name: string;
  };
  sets: Array<{
    id: number;
    setNumber: number;
    weight: string;
    reps: number;
  }>;
};

type Workout = {
  id: number;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  workoutExercises: WorkoutExercise[];
};

interface WorkoutsListProps {
  workouts: Workout[];
  selectedDate: Date;
}

export function WorkoutsList({ workouts, selectedDate }: WorkoutsListProps) {
  const calculateDuration = (workout: Workout) => {
    if (!workout.completedAt) return null;
    const start = new Date(workout.startedAt);
    const end = new Date(workout.completedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return minutes;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Workouts for {format(selectedDate, "do MMM yyyy")}
        </h2>
        <Button>
          Add Workout
        </Button>
      </div>

      <div className="space-y-4">
        {workouts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">
                No workouts logged for this date
              </p>
              <Button className="mt-4" variant="outline">
                Log Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          workouts.map((workout) => {
            const duration = calculateDuration(workout);

            return (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{workout.name || "Untitled Workout"}</CardTitle>
                      <CardDescription>
                        {duration && `${duration} minutes • `}
                        {workout.workoutExercises.length} exercise{workout.workoutExercises.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workout.workoutExercises.map((workoutExercise) => {
                      const totalSets = workoutExercise.sets.length;
                      // Get average reps and weight
                      const avgReps = totalSets > 0
                        ? Math.round(
                            workoutExercise.sets.reduce((sum, set) => sum + set.reps, 0) / totalSets
                          )
                        : 0;
                      const avgWeight = totalSets > 0
                        ? workoutExercise.sets.reduce((sum, set) => sum + parseFloat(set.weight), 0) / totalSets
                        : 0;

                      return (
                        <div
                          key={workoutExercise.id}
                          className="flex items-center justify-between py-2 px-3 bg-zinc-100 dark:bg-zinc-900 rounded-md"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {workoutExercise.exercise.name}
                          </span>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {totalSets} × {avgReps} {avgWeight > 0 && `@ ${avgWeight.toFixed(1)} lbs`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

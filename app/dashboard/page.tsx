"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// Mock workout data
const mockWorkouts = [
  {
    id: 1,
    name: "Morning Strength Session",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, weight: 185 },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: 70 },
      { name: "Cable Flyes", sets: 3, reps: 12, weight: 45 },
    ],
    duration: 65,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Evening Cardio",
    exercises: [
      { name: "Treadmill Run", sets: 1, reps: 30, weight: 0 },
    ],
    duration: 30,
    createdAt: new Date(),
  },
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Track your workouts and progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Datepicker Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>
                  Choose a date to view your workouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
                <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Selected: <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {format(selectedDate, "do MMM yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workouts List Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Workouts for {format(selectedDate, "do MMM yyyy")}
              </h2>
              <Button>
                Add Workout
              </Button>
            </div>

            <div className="space-y-4">
              {mockWorkouts.length === 0 ? (
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
                mockWorkouts.map((workout) => (
                  <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{workout.name}</CardTitle>
                          <CardDescription>
                            {workout.duration} minutes • {workout.exercises.length} exercises
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {workout.exercises.map((exercise, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 bg-zinc-100 dark:bg-zinc-900 rounded-md"
                          >
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {exercise.name}
                            </span>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {exercise.sets} × {exercise.reps} {exercise.weight > 0 && `@ ${exercise.weight} lbs`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

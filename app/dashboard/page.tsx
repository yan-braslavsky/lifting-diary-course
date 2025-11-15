import { Suspense } from "react";
import { getUserWorkoutsByDate } from "@/data/workouts";
import { DateSelector } from "@/components/dashboard/date-selector";
import { WorkoutsList } from "@/components/dashboard/workouts-list";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Await searchParams as per Next.js 15 async requirements
  const params = await searchParams;

  // Get date from URL or default to today
  const dateParam = params.date;
  const selectedDate = dateParam && typeof dateParam === 'string'
    ? new Date(dateParam)
    : new Date();

  // Fetch workouts for the selected date
  const workouts = await getUserWorkoutsByDate(selectedDate);

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
            <Suspense fallback={
              <Card>
                <CardContent className="py-8">
                  <div className="animate-pulse">Loading calendar...</div>
                </CardContent>
              </Card>
            }>
              <DateSelector />
            </Suspense>
          </div>

          {/* Workouts List Section */}
          <div className="lg:col-span-2">
            <Suspense fallback={
              <Card>
                <CardContent className="py-8">
                  <div className="animate-pulse">Loading workouts...</div>
                </CardContent>
              </Card>
            }>
              <WorkoutsList workouts={workouts} selectedDate={selectedDate} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
